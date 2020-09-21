import { Point } from "./Point.js";
import { Line } from "./Line.js";

export class Converter
{
    constructor()
    {
    }

    convertSlurTemplates(svg) 
    {
        // A short slur template is an arc having only two points.
        function ConvertShortSlurTemplates(svg)
        {
            // Returns an object having the following attributes:
            //    .origin
            //    .control1
            //    .control2
            //    .endPoint
            // All these attributes are Points having absolute coordinates.
            function getTemplatePoints(slurTemplate)
            {
                return {};
            }

            var slurTemplates = svg.getElementsByClassName("shortSlurTemplate");

            for(let i = 0; i < slurTemplates.length; ++i)
            {
                let slurTemplate = slurTemplates[i],
                    templateStrokeWidthStr = slurTemplate.getAttribute('stroke-width'),
                    templatePoints = getTemplatePoints(slurTemplate),
                    parentElement = slurTemplate.parentElement,
                    slur = document.createElementNS("http://www.w3.org/2000/svg", "path");

                if(templateStrokeWidthStr === null)
                {
                    // "stroke-width" was defined in a style, not locally.
                    let style = window.getComputedStyle(slurTemplate);
                    templateStrokeWidthStr = style.getPropertyValue('stroke-width');
                }

                let templateStrokeWidth = parseFloat(templateStrokeWidthStr); 

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

        ConvertShortSlurTemplates(svg);
        ConvertLongSlurTemplates(svg);

        return svg;
    }
}
