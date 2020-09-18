

function convertAllSlurTemplates()
{
    // A short slur template is an arc having only two points.
    function ConvertShortSlurTemplates(svg)
    {
        var slurTemplates = svg.getElementsByClassName("shortSlurTemplate");

        for(let i = 0; i < slurTemplates.length; ++i)
        {
            let slurTemplate = slurTemplates[i],
                parentElement = slurTemplate.parentElement,
                slur = document.createElementNS("http://www.w3.org/2000/svg", "path");

            //Set the short slur's attributes here (including its class)

            parentElement.insertBefore(slur, slurTemplate);
            parentElement.removeChild(slurTemplate);
        }
    }

    // A long slur template has one or more smooth control points
    // in addition to its two end points.
    function ConvertLongSlurTemplates(svg)
    {
        var longSlurTemplates = svg.getElementsByClassName("longSlurTemplate");

        for(let i = 0; i < longSlurTemplates.length; ++i)
        {
            let longSlurTemplate = longSlurTemplates[i],
                parentElement = longSlurTemplate.parentElement,
                longSlur = document.createElementNS("http://www.w3.org/2000/svg", "path");

            //Set the longSlur's attributes here (including its class)

            parentElement.insertBefore(longSlur, longSlurTemplate);
            parentElement.removeChild(longSlurTemplate);
        }
    }

    function downloadSVG(filename, svg)
    {
        // See: https://stackoverflow.com/questions/28450471/convert-inline-svg-to-base64-string
        let svgString = new XMLSerializer().serializeToString(svg),
            latin1SVGString = unescape(encodeURIComponent(svgString)),
            svgBase64 = btoa(latin1SVGString),
            link = document.createElement('a');

        link.setAttribute('download', filename);
        link.setAttribute('href', "data:image/svg+xml;base64," + svgBase64);
        link.click();
    }

    var iFrame = document.getElementById("iFrame"),
        svg = iFrame.contentDocument;

    ConvertShortSlurTemplates(svg);
    ConvertLongSlurTemplates(svg);

    let button = document.getElementById("convertButton");
    button.value = "Done";
    button.disabled = true;

    var fileName = "converted_" + iFrame.fileName;
    downloadSVG(fileName, svg);

    URL.revokeObjectURL(iFrame.src) // free memory
}

// called when the file input's onchange event fires.
function loadFile(event)
{
    // iFrame.src setting has been adapted from code found at
    // https://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
    // URL.revokeObjectURL(iFrame.src) // free memory is called after the conversion (above)

    var div1 = document.getElementById("div1"),
        div2 = document.getElementById("div2"),
        iFrame = document.getElementById('iFrame'),
        button = document.getElementById("convertButton");

    div1.style.display = "none";
    div2.style.display = "block";

    iFrame.width = window.screen.width;
    iFrame.height = window.screen.height - button.height;
    iFrame.src = URL.createObjectURL(event.target.files[0]);
    iFrame.fileName = event.target.files[0].name; // iFrame.fileName added for future reference
}