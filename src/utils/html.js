const cheerio = require('cheerio');

function sideBar(html) {
    // Load HTML content into cheerio
    const $ = cheerio.load(html);

    // Select all <a> tags within the div with ID "Table of Contents1"
    const anchorTags = $('#Table\\ of\\ Contents1 a');
    const sidebarContent = [];

    anchorTags.each((index, element) => {
        let a = $(element).attr('href');
        let href = ''
        if (a != undefined) {
            href = a.replace('#', '')

            sidebarContent.push(`
            <div class="flex my-2 __sidebar-heading">
                <label class="cursor-pointer flex items-center">
                    <input type="checkbox" class="checkbox checkbox-info" value="${href}" onchange="(function(e) {let content = document.getElementById(e.value); if (e.checked) { content.classList.remove('__hide-content'); } else { content.classList.add('__hide-content'); }})(this)" checked />
                </label>
                <a href="${a}">${$(element).text()}</a>
            </div>
        `);
        }
    });

    return `<!-- sidebar -->
        <div class="__sidebar min-h-screen border-r-2">
            ${sidebarContent.join('')}
        </div>
        <!-- end sidebar -->`;
}

function content(htmlContent) {

    // Load HTML content into cheerio
    const $ = cheerio.load(htmlContent);

    // Select all h1 elements
    const h1Elements = $('h1');
    // console.log(h1Elements.next('p').toString())
    let content = ''
    // Iterate over each h1 element
    h1Elements.each((index, element) => {
        // Find the next p element
        const h1 = $(element)
        h1.addClass('__title my-4');
        const name = h1.find('a').attr('name')
        h1.find('a').remove()

        const p = $(element).next('p');
        p.addClass('__sub_title')


        // Create a div to wrap the h1 and the next p element
        const $div = $(`<div class="__content" id="${name}" name="${name}"></div>`);
        $div.append(h1);
        $div.append(p);
        content += $div.toString()
    });

    // Print the modified HTML content
    // console.log($.html());
    return content
}

function scrap(html) {

    const side = sideBar(html)
    const right = content(html)
    let web = `<div class="__bg_wrapper">
                ${side}
                <div class="__bg_content">
                    ${right}
                </div>
            </div>
    `
    return web
}



module.exports = { scrap }
