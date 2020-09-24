import { Point } from "./Point.js";
import { Line } from "./Line.js";

// Converts objects having class "slurTemplate" to objects of class 'slur'.
// The templates must use absolute coordinates in their path.d attributes.
export class Converter
{
    constructor()
    {
    }

    // Returns the svg in which "slurTemplate" paths have been replaced by their equivalent "slur" 
    // A slur template is a path having two end points between which there are zero or more tangent points.
    // The path.class attribute must be set to "slurTemplate", which defines the stroke-width.
    // The path.d string must contain absolute coordinates (i.e. use 'C' and 'S', not 'c' and 's').
    // The slur replaces the slurTemplate at the same position in the svg, and is styled by being given a
    // class="slur" attribute. The "slur" CSS definition is expected to exist already in the svg. 
    convertSlurTemplates(svg) 
    {
        function getTemplateStrokeWidth(slurTemplate)
        {
            let strokeWidthStr = slurTemplate.getAttribute('stroke-width');

            if(strokeWidthStr === null)
            {
                // "stroke-width" was defined in a style, not locally.
                let style = window.getComputedStyle(slurTemplate);

                strokeWidthStr = style.getPropertyValue('stroke-width');
            }

            return parseFloat(strokeWidthStr);
        }

        // Returns an object having the following attributes:
        //    .startPair
        //    .endPair
        //    .tangentPairs[]
        // Each Pair is an object having two Points: point and control.
        // For example:
        //     templatePointPairs.startPair.point
        //     templatePointPairs.tangentPairs[0].control
        //     etc.
        // All Points have absolute coordinates.
        function getTemplatePointPairs(slurTemplate)
        {
            function getPoints(dStr)
            {
                // Returns an array of Numbers that are in the order given in the argument string (the path's d-attribute).
                // This function is complicated by the fact that the SVG standard allows y-coordinates
                // to be separated from x-coordinates not only by ',' characters, but also by '+' and '-' characters.
                // Relative path coordinates ('m', 'c', 's') are not allowed.
                // 'M', 'C', 'S', 'Z' and 'z' characters in dStr are ignored.
                function getCoordinates(dStr)
                {
                    let str = "", coordinates = [];

                    for(let i = 0; i < dStr.length; ++i) // ignore 'M'
                    {
                        if(dStr[i] === 'm' || dStr[i] === 'c' || dStr[i] === 's')
                        {
                            throw "Relative path coordinates are not allowed."
                        }

                        if(dStr[i] === 'M' || dStr[i] === 'Z' || dStr[i] === 'z')
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
                        else if(dStr[i] === ',' || dStr[i] === 'C' || dStr[i] === 'S') // move to next coordinate
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

                let coordinates = getCoordinates(dStr),
                    points = [];

                for(let i = 0; i < coordinates.length; i += 2)
                {
                    points.push(new Point(coordinates[i], coordinates[i + 1]));
                }
                return points;
            }

            function getPointPairs(points)
            {
                let pointPairs = {};

                pointPairs.startPair = {};
                pointPairs.startPair.point = points[0];
                pointPairs.startPair.control = points[1];

                pointPairs.endPair = {};
                pointPairs.endPair.point = points[points.length - 1];
                pointPairs.endPair.control = points[points.length - 2];

                pointPairs.tangentPairs = [];
                for(let i = 2; i < points.length - 2; i += 2)
                {
                    let tangentPair = {};
                    tangentPair.control = points[i];
                    tangentPair.point = points[i + 1];
                    pointPairs.tangentPairs.push(tangentPair);
                }

                return pointPairs;
            }

            let dStr = slurTemplate.getAttribute("d"),
                points = getPoints(dStr),
                templatePointPairs = getPointPairs(points);

            if(templatePointPairs.startPair.point.x >= templatePointPairs.endPair.point.x)
            {
                throw "Illegal slur template: the start point must be left of the end point!";
            }

            if(templatePointPairs.startPair.control.x >= templatePointPairs.endPair.control.x)
            {
                throw "Illegal slur template: control point 1 must be left of control point 2!";
            }

            return templatePointPairs;
        }

        // Returns the string that is going to be the short slur's d-attribute.
        function getShortSlurDStr(templatePointPairs, templateStrokeWidth)
        {
            function getAngledLine(controlLine, angle)
            {
                let point = controlLine.point2.clone();
                point.rotate(controlLine.point1, angle);

                return new Line(controlLine.point1, point);
            }

            // Both the arguments and the returned string are absolute coordinates.
            function getDStr(startPoint, upperCP1, upperCP2, endPoint, lowerCP2, lowerCP1)
            {
                function getCoordinateString(point)
                {
                    let xStr = point.x.toString(),
                        yStr = point.y.toString();

                    return xStr + "," + yStr;
                }

                const relX = startPoint.x,
                    relY = startPoint.y;

                upperCP1.round(1);
                upperCP2.round(1);
                endPoint.round(1);
                lowerCP2.round(1);
                lowerCP1.round(1);

                let point1Str = getCoordinateString(startPoint),
                    upperCP1Str = getCoordinateString(upperCP1),
                    upperCP2Str = getCoordinateString(upperCP2),
                    point2Str = getCoordinateString(endPoint),
                    lowerCP2Str = getCoordinateString(lowerCP2),
                    lowerCP1Str = getCoordinateString(lowerCP1),
                    dStr;

                dStr = "M" + point1Str + "C" + upperCP1Str + "," + upperCP2Str + "," + point2Str + "C" + lowerCP2Str + "," + lowerCP1Str + "," + point1Str + "z";

                return dStr;
            }

            const endAngle = 5, // degrees
                startPair = templatePointPairs.startPair,
                endPair = templatePointPairs.endPair,
                lineA = new Line(startPair.control, endPair.control),
                heightA = lineA.point2.y - lineA.point1.y,
                widthA = lineA.point2.x - lineA.point1.x,
                hypA = Math.sqrt((widthA * widthA) + (heightA * heightA)),
                cosA = widthA / hypA,
                startControlLine = new Line(startPair.point, startPair.control),
                endControlLine = new Line(endPair.point, endPair.control),

                lineC = getAngledLine(startControlLine, -endAngle),
                lineD = getAngledLine(startControlLine, endAngle),
                lineE = getAngledLine(endControlLine, -endAngle),
                lineF = getAngledLine(endControlLine, endAngle);

            let lineB = lineA.clone(),
                lineK = lineA.clone(),
                yShift = ((templateStrokeWidth * 0.5) / cosA); // cosA cannot be 0 (see template conditions in getTemplatePoints() above).

            lineB.move(0, -yShift);
            lineK.move(0, yShift);

            const upperCP1 = lineB.intersectionPoint(lineC),
                upperCP2 = lineB.intersectionPoint(lineF),
                lowerCP1 = lineK.intersectionPoint(lineD),
                lowerCP2 = lineK.intersectionPoint(lineE),
                dStr = getDStr(startPair.point, upperCP1, upperCP2, endPair.point, lowerCP2, lowerCP1);

            return dStr;
        }

        // Returns the string that is going to be the long slur's d-attribute.
        function getLongSlurDStr(templatePointPairs, templateStrokeWidth)
        {
            function getAngledLine(controlLine, angle)
            {
                let point = controlLine.point2.clone();
                point.rotate(controlLine.point1, angle);

                return new Line(controlLine.point1, point);
            }

            function pairClone(pointPair)
            {
                let pointClone = pointPair.point.clone(),
                    controlClone = pointPair.control.clone();

                return { point: pointClone, control: controlClone };
            }

            // Returns a clone of each tangentPair shifted by shift units at right angles to itself.
            function shiftedTangentsPointPairSequence(tangentPairs, shift)
            {
                let tangentPointPairSequence = [];
                for(let i = 0; i < tangentPairs.length; ++i)
                {
                    tangentPointPairSequence.push(pairClone(tangentPairs[i]));
                }
                for(let i = 0; i < tangentPointPairSequence.length; ++i)
                {
                    
                    let cPoint = tangentPointPairSequence[i].control,
                        pPoint = tangentPointPairSequence[i].point,
                        dx = pPoint.x - cPoint.x,
                        dy = pPoint.y - cPoint.y,
                        h = Math.sqrt((dx * dx) + (dy * dy)),
                        factor = shift / h,
                        xShift = (dy * factor) * -1,
                        yShift = dx * factor;

                    cPoint.move(xShift, yShift);
                    pPoint.move(xShift, yShift);
                }

                return tangentPointPairSequence;
            }

            function setStartAndEndControlPoints(pointPairSequence)
            {
                            //const endAngle = 5, // degrees
            //    startPair = templatePointPairs.startPair,
            //    endPair = templatePointPairs.endPair,
            //    lineA = new Line(startPair.control, endPair.control),
            //    heightA = lineA.point2.y - lineA.point1.y,
            //    widthA = lineA.point2.x - lineA.point1.x,
            //    hypA = Math.sqrt((widthA * widthA) + (heightA * heightA)),
            //    cosA = widthA / hypA,
            //    startControlLine = new Line(startPair.point, startPair.control),
            //    endControlLine = new Line(endPair.point, endPair.control),

            //    lineC = getAngledLine(startControlLine, -endAngle),
            //    lineD = getAngledLine(startControlLine, endAngle),
            //    lineE = getAngledLine(endControlLine, -endAngle),
            //    lineF = getAngledLine(endControlLine, endAngle);

            //let lineB = lineA.clone(),
            //    lineK = lineA.clone(),
            //    yShift = ((templateStrokeWidth * 0.5) / cosA); // cosA cannot be 0 (see template conditions in getTemplatePoints() above).

            //lineB.move(0, -yShift);
            //lineK.move(0, yShift);

            //const upperCP1 = lineB.intersectionPoint(lineC),
            //    upperCP2 = lineB.intersectionPoint(lineF),
            //    lowerCP1 = lineK.intersectionPoint(lineD),
            //    lowerCP2 = lineK.intersectionPoint(lineE),
            //    dStr = getDStr(startPair.point, upperCP1, upperCP2, endPair.point, lowerCP2, lowerCP1);

            }

            // returns a pointPair sequence that includes the start and end points.
            function getUpperPointPairSequence(templatePointPairs, templateStrokeWidth)
            {
                // move the tangent points and control points outwards
                let upperPointPairSequence = shiftedTangentsPointPairSequence(templatePointPairs.tangentPairs, -(templateStrokeWidth / 2));

                upperPointPairSequence.splice(0, 0, pairClone(templatePointPairs.startPair));
                upperPointPairSequence.push(pairClone(templatePointPairs.endPair));

                setStartAndEndControlPoints(upperPointPairSequence);
                
                return upperPointPairSequence;
            }

            function getLowerPointPairSequence(templatePointPairs, templateStrokeWidth)
            {
                // move the tangent points and control points inwards
                let lowerPointPairSequence = shiftedTangentsPointPairSequence(templatePointPairs.tangentPairs, (templateStrokeWidth / 2));

                // reverse the point and control direction of the tangents here (only for the lower tangents)

                lowerPointPairSequence.splice(0, 0, pairClone(templatePointPairs.endPair));
                lowerPointPairSequence.push(pairClone(templatePointPairs.startPair));

                setStartAndEndControlPoints(lowerPointPairSequence);

                return lowerPointPairSequence;
            }

            // The arguments and returned string all use absolute coordinates.
            function getDStr(upperPointPairSequence, lowerPointPairSequence)
            {
                function getCoordinateString(point)
                {
                    let xStr = point.x.toString(),
                        yStr = point.y.toString();

                    return xStr + "," + yStr;
                }

                function getPointPairSequence(startPair, tangentsPointPairSequence)
                {
                    let pairSequence = [];

                    pairSequence.push(startPair);
                    for(let i = 0; i < tangentsPointPairSequence.length; ++i)
                    {
                        pairSequence.push(tangentsPointPairSequence[i]);
                    }

                    return pairSequence;
                }

                let dStr = "";

                if(upperPointPairSequence.length === 2)
                {
                    // two point slur
                    let point1 = upperPointPairSequence[0].point,
                        upperCP1 = upperPointPairSequence[0].control,
                        upperCP2 = upperPointPairSequence[1].control,
                        point2 = upperPointPairSequence[1].point,
                        lowerCP2 = lowerPointPairSequence[0].control,
                        lowerCP1 = lowerPointPairSequence[1].control;

                    upperCP1.round(1);
                    upperCP2.round(1);
                    point2.round(1);
                    lowerCP2.round(1);
                    lowerCP1.round(1);

                    let point1Str = getCoordinateString(point1),
                        upperCP1Str = getCoordinateString(upperCP1),
                        upperCP2Str = getCoordinateString(upperCP2),
                        point2Str = getCoordinateString(point2),
                        lowerCP2Str = getCoordinateString(lowerCP2),
                        lowerCP1Str = getCoordinateString(lowerCP1),
                        dStr;

                    dStr = "M" + point1Str + "C" + upperCP1Str + "," + upperCP2Str + "," + point2Str + "C" + lowerCP2Str + "," + lowerCP1Str + "," + point1Str + "z";

                }
                else
                {
                    // slur with tangents
                    upperPointPairSequence = getPointPairSequence(startPair, upperPointPairSequence);
                    lowerPointPairSequence = getPointPairSequence(endPair, lowerPointPairSequence);
                }

                return dStr;
            }

            let upperPointPairSequence = getUpperPointPairSequence(templatePointPairs, templateStrokeWidth),
                lowerPointPairSequence = getLowerPointPairSequence(templatePointPairs, templateStrokeWidth),
                dStr = getDStr(upperPointPairSequence, lowerPointPairSequence);

            return dStr;
        }

        var slurTemplates = svg.getElementsByClassName("slurTemplate");

        for(let i = 0; i < slurTemplates.length; ++i)
        {
            let slurTemplate = slurTemplates[i],
                templateStrokeWidth = getTemplateStrokeWidth(slurTemplate),
                templatePointPairs = getTemplatePointPairs(slurTemplate),
                parentElement = slurTemplate.parentElement,
                slur = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                dStr = "";

            if(templatePointPairs.tangentPairs.length === 0)
            {
                dStr = getShortSlurDStr(templatePointPairs, templateStrokeWidth);
            }
            else
            {
                dStr = getLongSlurDStr(templatePointPairs, templateStrokeWidth);
            }

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

        return svg;
    }
}
