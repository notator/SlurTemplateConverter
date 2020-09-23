import { Point } from "./Point.js";
import { Line } from "./Line.js";

// Converts objects having class "shortSlurTemplate" or "longSlurTemplate" to objects of class 'slur'.
// The templates can use either relative or absolute coordinates in their path.d attributes.
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
                // Returns an array of Numbers that are in the order given in the argument string.
                // This function is a bit complicated because the SVG standard allows y-coordinates
                // to be separated from x-coordinates not only by ',' characters, but also by '+' and
                // '-' characters.
                function getCoordinates(cStr)
                {
                    let str = "", coordinates = [];

                    for(let i = 0; i < cStr.length; ++i)
                    {
                        if(cStr[i] === '-' || cStr[i] === '+')
                        {
                            if(str.length === 0)
                            {
                                str += cStr[i]; // + or - at start of str
                            }
                            else // move to next coordinate (no comma separator!)
                            {
                                coordinates.push(parseFloat(str));
                                str = cStr[i];
                            }
                        }
                        else if(cStr[i] === '.')
                        {
                            if(str.length === 0)
                            {
                                str = "0.";
                            }
                            else // continue decimal
                            {
                                str += ".";
                            }
                        }
                        else if(cStr[i] === ',')// move to next coordinate
                        {
                            coordinates.push(parseFloat(str));
                            str = "";
                        }
                        else if(Number.parseInt(cStr[i]) !== NaN)
                        {
                            str += cStr[i];
                        }
                        else
                        {
                            throw "Error parsing coordinates string.";
                        }
                    }

                    coordinates.push(parseFloat(str));

                    return coordinates;
                }

                function getOtherPoints(str, point1, absoluteUnits)
                {
                    let otherPoints = {},
                        coordinates = getCoordinates(str);

                    otherPoints.control1 = new Point(coordinates[0], coordinates[1]);
                    otherPoints.control2 = new Point(coordinates[2], coordinates[3]);
                    otherPoints.point2 = new Point(coordinates[4], coordinates[5]);

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

                let coordinates = getCoordinates(strs[0].replace('M', ''));
                templatePoints.point1 = new Point(coordinates[0], coordinates[1]) 

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

                // Both the arguments and the returned string are absolute coordinates.
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
                    
                    dStr = "M" + point1Str + "C" + outerCP1Str + "," + outerCP2Str + "," + point2Str + "C" + innerCP2Str + "," + innerCP1Str + "," + point1Str + "z";

                    return dStr;
                }

                const endAngle = 5, // degrees
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

                let lineB = lineA.clone(),
                    lineK = lineA.clone(),
                    yShift = ((templateStrokeWidth * 0.5) / cosA); // cosA cannot be 0 (see template conditions in getTemplatePoints() above).

                lineB.move(0, -yShift);
                lineK.move(0, yShift);

                const outerCP1 = lineB.intersectionPoint(lineC),
                    outerCP2 = lineB.intersectionPoint(lineF),
                    innerCP1 = lineK.intersectionPoint(lineD),
                    innerCP2 = lineK.intersectionPoint(lineE),
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
            }

            for(let i = slurTemplates.length - 1; i >= 0; --i)
            {
                let slurTemplate = slurTemplates[i],
                    parentElement = slurTemplate.parentElement;
                
                parentElement.removeChild(slurTemplate);
            }
        }

        // A long slur template has one or more smooth control points
        // in addition to its two end points.
        function ConvertLongSlurTemplates(svg)
        {
            // Returns an object having the following attributes:
            //    .point1
            //    .control1
            //    .control2
            //    .point2
            //    [controlPoint, point] -- can be empty
            // All these attributes are Points having absolute coordinates.
            function getTemplatePoints(slurTemplate)
            {
                // Returns an array of Numbers that are in the order given in the argument string (the path's d-attribute).
                // This function is a bit complicated because the SVG standard allows y-coordinates
                // to be separated from x-coordinates not only by ',' characters, but also by '+' and
                // '-' characters.
                // 'M', 'C', 'c', 'S', 's', 'Z' and 'z' characters in dStr are ignored.
                function getCoordinates(dStr)
                {
                    let str = "", coordinates = [];

                    for(let i = 0; i < dStr.length; ++i) // ignore 'M'
                    {
                        if(dStr[i] === 'M' || dStr[i] === 'm' || dStr[i] === 'Z' || dStr[i] === 'z')
                        {
                            continue;
                        }
                        if(dStr[i] === '-' || dStr[i] === '+')
                        {
                            if(str.length === 0)
                            {
                                str += dStr[i]; // + or - at start of str
                            }
                            else // move to next coordinate (no comma separator!)
                            {
                                coordinates.push(parseFloat(str));
                                str = dStr[i];
                            }
                        }
                        else if(dStr[i] === '.')
                        {
                            if(str.length === 0)
                            {
                                str = "0.";
                            }
                            else // continue decimal
                            {
                                str += ".";
                            }
                        }
                        else if(dStr[i] === ',' || dStr[i] === 'C' || dStr[i] === 'c' || dStr[i] === 'S' || dStr[i] === 's') // move to next coordinate
                        {
                            coordinates.push(parseFloat(str));
                            str = "";
                        }
                        else if(Number.parseInt(dStr[i]) !== NaN)
                        {
                            str += dStr[i];
                        }
                        else
                        {
                            throw "Error parsing coordinates string.";
                        }
                    }

                    coordinates.push(parseFloat(str));

                    return coordinates;
                }

                function getTemplatePoints(coordinates, absoluteUnits)
                {
                    let templatePoints = {}, sPoints = [];                        

                    templatePoints.point1 = new Point(coordinates[0], coordinates[1]);
                    templatePoints.control1 = new Point(coordinates[2], coordinates[3]);
                    templatePoints.control2 = new Point(coordinates[4], coordinates[5]);
                    templatePoints.point2 = new Point(coordinates[6], coordinates[7]);
                    templatePoints.sPoints = sPoints;

                    if(coordinates.length > 8)
                    {
                        for(let i = 8; i < coordinates.length; i += 2)
                        {
                            sPoints.push(new Point(coordinates[i], coordinates[i + 1]));
                        }                       
                    }

                    if(absoluteUnits === false)
                    {
                        // set absolute units
                        let dx = templatePoints.point1.getX(),
                            dy = templatePoints.point1.getY();

                        templatePoints.control1.move(dx, dy);
                        templatePoints.control2.move(dx, dy);
                        templatePoints.point2.move(dx, dy);
                        for(let i = 0; i < sPoints.length; ++i)
                        {
                            sPoints[i].move(dx, dy);
                        }
                    }

                    return templatePoints;
                }

                let dStr = slurTemplate.getAttribute("d"),
                    absoluteUnits = false;

                if(dStr.indexOf('C') >= 0)
                {
                    absoluteUnits = true;
                }

                let coordinates = getCoordinates(dStr),
                    templatePoints = getTemplatePoints(coordinates, absoluteUnits);

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

                // Both the arguments and the returned string are absolute coordinates.
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

                    dStr = "M" + point1Str + "C" + outerCP1Str + "," + outerCP2Str + "," + point2Str + "C" + innerCP2Str + "," + innerCP1Str + "," + point1Str + "z";

                    return dStr;
                }

                const endAngle = 5, // degrees
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

                let lineB = lineA.clone(),
                    lineK = lineA.clone(),
                    yShift = ((templateStrokeWidth * 0.5) / cosA); // cosA cannot be 0 (see template conditions in getTemplatePoints() above).

                lineB.move(0, -yShift);
                lineK.move(0, yShift);

                const outerCP1 = lineB.intersectionPoint(lineC),
                    outerCP2 = lineB.intersectionPoint(lineF),
                    innerCP1 = lineK.intersectionPoint(lineD),
                    innerCP2 = lineK.intersectionPoint(lineE),
                    dStr = getDStr(tps.point1, outerCP1, outerCP2, tps.point2, innerCP2, innerCP1);

                return dStr;
            }

            var slurTemplates = svg.getElementsByClassName("longSlurTemplate");

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
            }

            for(let i = slurTemplates.length - 1; i >= 0; --i)
            {
                let slurTemplate = slurTemplates[i],
                    parentElement = slurTemplate.parentElement;

                parentElement.removeChild(slurTemplate);
            }
        }

        ConvertShortSlurTemplates(svg);
        ConvertLongSlurTemplates(svg);

        return svg;
    }
}
