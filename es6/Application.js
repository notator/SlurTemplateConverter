import { Converter } from "./Converter.js";

export class Application
{
    constructor()
    {
    }

    // called when the "Convert Templates" button is clicked.
    convert()
    {
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

        let iFrame = document.getElementById("iFrame"),
            svg = iFrame.contentDocument,
            converter = new Converter();

        svg = converter.convertSlurTemplates(svg);

        let button = document.getElementById("convertButton");
        button.value = "Done";
        button.disabled = true;

        var fileName = "converted_" + iFrame.fileName;
        downloadSVG(fileName, svg);

        URL.revokeObjectURL(iFrame.src) // free memory
    }

    // called when the file input's onchange event fires.
    loadFile(event)
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

}

App = new Application();
