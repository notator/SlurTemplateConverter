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
            //    .point1
            //    .control1
            //    .control2
            //    .point2
            // All these attributes are Points having absolute coordinates.
            function getTemplatePoints(slurTemplate)
            {
                function getPoint1(str)
                {
                    let strs = str.split(','), xStr, yStr;
                    
                    xStr = strs[0].replace('M', '');
                    yStr = strs[1];

                    return new Point(parseFloat(xStr), parseFloat(yStr));
                }

                function getOtherPoints(str, point1, absoluteUnits)
                {
                    let otherPoints = {},
                        strs = str.split(',');

                    otherPoints.control1 = new Point(parseFloat(strs[0]), parseFloat(strs[1]));
                    otherPoints.control2 = new Point(parseFloat(strs[2]), parseFloat(strs[3]));
                    otherPoints.point2 = new Point(parseFloat(strs[4]), parseFloat(strs[5]));

                    if(absoluteUnits === false)
                    {
                        let dx = point1.getX(),
                            dy = point1.getY();

                        otherPoints.control1.move(dx, dy);
                        otherPoints.control2.move(dx, dy);
                        otherPoints.point2.move(dx, dy);
                    }

                    return otherPoints;
                }

                let templatePoints = {},
                    dStr = slurTemplate.getAttribute("d"),
                    strs, absoluteUnits = false;

                strs = dStr.split('c');
                if(strs.length === 1)
                {
                    strs = dstr.split('C');
                    absoluteUnits = true;
                }

                templatePoints.point1 = getPoint1(strs[0]);

                let otherPoints = getOtherPoints(strs[1], templatePoints.point1, absoluteUnits);

                templatePoints.control1 = otherPoints.control1;
                templatePoints.control2 = otherPoints.control2;
                templatePoints.point2 = otherPoints.point2;

                return templatePoints;
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
