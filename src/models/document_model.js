const { sequelize } = require("../utils/database.js");
const { DataTypes } = require('sequelize');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date: {
        type: DataTypes.BIGINT(12),
        allowNull: true
    },
    expires: {
        type: DataTypes.BIGINT(12),
        allowNull: true
    },
    owner: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    folder: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    folderList: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    inheritAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    defaultAccess: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    locked: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    keywords: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sequence: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'tblDocuments', 
    timestamps: false // Set to true if your table has timestamp fields (createdAt, updatedAt)
});

//   // Define relationships
//   Document.belongsTo(Folder, { foreignKey: 'folder' });
//   Document.belongsTo(User, { foreignKey: 'owner' });

// Export the Document model
module.exports = { Document };