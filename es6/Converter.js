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
                        // set absolute units
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

                if(templatePoints.point1.getX() >= templatePoints.point2.getX())
                {
                    throw "Illegal short slur template: the first point must be left of the end-point!";
                }

                if(templatePoints.control1.getX() >= templatePoints.control2.getX())
                {
                    throw "Illegal short slur template: control point 1 must be left of control point 2!";
                }

                return templatePoints;
            }

            // Returns the string that is going to be the new slur's d-attribute.
            function getSlurDStr(templatePoints, templateStrokeWidth)
            {
                function getAngledLine(controlLine, angle)
                {
                    let point = controlLine.point2.clone();
                    point.rotate(controlLine.point1, angle);

                    return new Line(controlLine.point1, point);
                }

                // Arguments are absolute coordinates. The returned string is in relative coordinates
                function getDStr(point1, outerCP1, outerCP2, point2, innerCP2, innerCP1)
                {
                    function getCoordinateString(point)
                    {
                        let xStr = point.getX().toString(),
                            yStr = point.getY().toString();

                        return xStr + "," + yStr;
                    }

                    const relX = point1.getX(),
                        relY = point1.getY();

                    // set to relative coordinates.
                    outerCP1.move(-relX, -relY);
                    outerCP2.move(-relX, -relY);
                    point2.move(-relX, -relY);
                    innerCP2.move(-relX, -relY);
                    innerCP1.move(-relX, -relY);

                    outerCP1.round(1);
                    outerCP2.round(1);
                    point2.round(1);
                    innerCP2.round(1);
                    innerCP1.round(1);

                    let point1Str = getCoordinateString(point1),
                        outerCP1Str = getCoordinateString(outerCP1),
                        outerCP2Str = getCoordinateString(outerCP2),
                        point2Str = getCoordinateString(point2),
                        innerCP2Str = getCoordinateString(innerCP2),
                        innerCP1Str = getCoordinateString(innerCP1),
                        dStr;
                    
                    dStr = "M" + point1Str + "c" + outerCP1Str + "," + outerCP2Str + "," + point2Str + "c" + innerCP2Str + "," + innerCP1Str + "," + point1Str + "z";

                    return dStr;
                }

                const endAngle = 3,
                    tps = templatePoints,
                    lineA = new Line(tps.control1, tps.control2),
                    heightA = lineA.point2.getY() - lineA.point1.getY(),
                    widthA = lineA.point2.getX() - lineA.point1.getX(),
                    hypA = Math.sqrt((widthA * widthA) + (heightA * heightA)),
                    cosA = widthA / hypA,           
                    controlLine1 = new Line(tps.point1, tps.control1),
                    controlLine2 = new Line(tps.point2, tps.control2),

                    lineC = getAngledLine(controlLine1, -endAngle),
                    lineD = getAngledLine(controlLine1, endAngle),
                    lineE = getAngledLine(controlLine2, -endAngle),
                    lineF = getAngledLine(controlLine2, endAngle);

                let lineB = lineA.clone();
                // cosA cannot be 0, because template conditions are imposed in getTemplatePoints() above.
                lineB.move(0, ((templateStrokeWidth / 2) / cosA) * -1);

                const outerCP1 = lineB.intersectionPoint(lineC),
                    outerCP2 = lineB.intersectionPoint(lineF),
                    lineG = new Line(tps.control1, outerCP1),
                    lineH = new Line(tps.control2, outerCP2),
                    innerCP1 = lineD.intersectionPoint(lineG),
                    innerCP2 = lineE.intersectionPoint(lineH),
                    dStr = getDStr(tps.point1, outerCP1, outerCP2, tps.point2, innerCP2, innerCP1);

                return dStr;
            }

            var slurTemplates = svg.getElementsByClassName("shortSlurTemplate");

            for(let i = 0; i < slurTemplates.length; ++i)
            {
                let slurTemplate = slurTemplates[i],
                    templateStrokeWidthStr = slurTemplate.getAttribute('stroke-width'),
                    templatePoints = getTemplatePoints(slurTemplate);

                if(templateStrokeWidthStr === null)
                {
                    // "stroke-width" was defined in a style, not locally.
                    let style = window.getComputedStyle(slurTemplate);
                    templateStrokeWidthStr = style.getPropertyValue('stroke-width');
                }

                let parentElement = slurTemplate.parentElement,
                    slur = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                    templateStrokeWidth = parseFloat(templateStrokeWidthStr),
                    dStr = getSlurDStr(templatePoints, templateStrokeWidth); 

                slur.setAttribute('d', dStr);
                slur.setAttribute('class', 'slur');

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
