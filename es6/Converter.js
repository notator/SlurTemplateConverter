import { Point } from "./Point.js";
import { Line } from "./Line.js";

export class Converter
{
    constructor(svg)
    {
        this.svg = svg;
    }

    convertSlurTemplates(svg) 
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

        ConvertShortSlurTemplates(svg);
        ConvertLongSlurTemplates(svg);

        return svg;
    }
}
