const { sequelize } = require("../utils/database");
const { DataTypes } = require('sequelize')
require('dotenv').config()
const fs = require('fs/promises')
const { exec } = require('child_process');
const { scrap } = require("../utils/html");
const p = require('path');
const { Document } = require("../models/document_model");
const { Client } = require('@elastic/elasticsearch');
const { getEmbedding } = require("../embedding");
const client = new Client({ node: 'http://localhost:9200' })
const cheerio = require('cheerio');

const path = process.env.DOCUMENT_PATH
// 2. Define a model for your queue table
const QueueItem = sequelize.define('QueueItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    task: {
        type: DataTypes.STRING(150),
        allowNull: false // Assuming task cannot be null
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    data: {
        type: DataTypes.JSON, // Corrected the data type to DataTypes.JSON
        allowNull: true // Assuming data can be null
    }
});

// 3. Implement functions to interact with the queue
const QueueService = {
    enqueue: async function (task) {
        try {
            await QueueItem.create({ task: task, status: 'pending' });
            console.log('Task enqueued:', task);
        } catch (error) {
            console.error('Error enqueueing task:', error);
        }
    },

    dequeue: async function () {
        try {
            const task = await QueueItem.findOne({ where: { status: 'pending' } });
            console.log(task)
            if (task) {
                await task.update({ status: 'processing' });

                const taskPath = task.dataValues.data
                const filePath = path + taskPath.dir + taskPath.version
                const temDir = 'tmp'
                const libreOfficeCommand = `libreoffice --headless --convert-to html ${filePath + taskPath.fileType} --outdir ${temDir}`;

                exec(libreOfficeCommand, async (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error converting file to HTML: ${error.message}`);
                    }
                    if (stderr) {
                        console.error(`Error converting file to HTML: ${stderr}`);
                    }

                    // Read the converted HTML file from the parent directory
                    const data = await fs.readFile(p.join(__dirname, '..', '..', temDir, taskPath.version + '.html'), 'utf-8');
                    // Send the converted HTML content as response
                    const htmlData = scrap(data)
                    const $ = cheerio.load(htmlData);
                    const sidebarText = $('.__sidebar').text();
                    const documentToUpdate = await Document.findByPk(taskPath.document);

                    const vector = await getEmbedding(`${sidebarText}`)
                    const response = await client.index({
                        index: 'test_vector',
                        body: {
                            id: documentToUpdate.id,
                            name: documentToUpdate.name,
                            text: sidebarText,
                            vector: vector
                        },
                        refresh: 'true',
                    })
                    console.log(response)

                    await documentToUpdate.update({ content: htmlData })
                });
                console.log('Task dequeued:', task.task);
                return task;
            } else {
                console.log('No pending tasks found.');
                return null;
            }
        } catch (error) {
            console.error('Error dequeuing task:', error);
            return null;
        }
    },

    completeTask: async function (task) {
        try {
            console.log(task.dataValues.data.orgFileName)

            await task.update({ status: 'completed' });
            console.log('Task completed:', task.task);
        } catch (error) {
            console.error('Error completing task:', error);
        }
    },
};

// Example usage:
async function main() {

    // Dequeue tasks
    const task = await QueueService.dequeue();
    if (task) {
        await QueueService.completeTask(task);
    }

    setTimeout(async () => {
        main()
    }, 5000);


}

main();