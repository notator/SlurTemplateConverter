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

        function getAngledLine(controlLine, angle)
        {
            let point = controlLine.point2.clone();
            point.rotate(controlLine.point1, angle);

            return new Line(controlLine.point1, point);
        }

        function getCoordinateString(point)
        {
            let xStr, yStr;

            point.round(1);
            xStr = point.x.toString();
            yStr = point.y.toString();

            return xStr + "," + yStr;
        }

        // Returns the string that is going to be the short slur's d-attribute.
        function getShortSlurDStr(templatePointPairs, templateStrokeWidth)
        {
            // Both the arguments and the returned string are absolute coordinates.
            function getDStr(startPoint, upperCP1, upperCP2, endPoint, lowerCP2, lowerCP1)
            {
                const relX = startPoint.x,
                    relY = startPoint.y;

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

            // make slurs that change direction thinner.
            if(((startPair.point.y < startPair.control.y) && (endPair.point.y > endPair.control.y))
            || ((startPair.point.y > startPair.control.y) && (endPair.point.y < endPair.control.y)))
            {
                // the slur changes direction
                yShift *= 0.4; 
            }

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
            function pairClone(pointPair)
            {
                let pointClone = pointPair.point.clone(),
                    controlClone = pointPair.control.clone();

                return { point: pointClone, control: controlClone };
            }

            // Returns tangent point triples of the form {point, controlIn, controlOut}.
            // Algorithm: For each tangentPair
            // 1. clone it, and shift the clone by shift units at right angles to itself.
            // 2. create the triple, setting 
            //        triple.point = clone.point
            //        triple.controlIn = clone.control
            //        triple.controlOut = the mirror of triple.controlIn about triple.point
            function getShiftedTangentPointTriples(tangentPairs, shift)
            {
                function shiftPoints(tangentPairsClone, shift)
                {
                    for(let i = 0; i < tangentPairsClone.length; ++i)
                    {

                        let cPoint = tangentPairsClone[i].control,
                            pPoint = tangentPairsClone[i].point,
                            dx = pPoint.x - cPoint.x,
                            dy = pPoint.y - cPoint.y,
                            h = Math.sqrt((dx * dx) + (dy * dy)),
                            factor = shift / h,
                            xShift = (dy * factor) * -1,
                            yShift = dx * factor;

                        cPoint.move(xShift, yShift);
                        pPoint.move(xShift, yShift);
                    }

                }

                function getTangentPointTriples(tangentPairsClone)
                {
                    function newMirrorControlPoint(point, controlIn)
                    {
                        let xDiff = point.x - controlIn.x,
                            yDiff = point.y - controlIn.y,
                            controlOut = new Point(point.x + xDiff, point.y + yDiff);

                        return controlOut;
                    }

                    let tangentPointTriples = []
                    for(let i = 0; i < tangentPairsClone.length; ++i)
                    {
                        let tangentPair = tangentPairsClone[i],
                            triple = {};
                        triple.point = tangentPair.point;
                        triple.controlIn = tangentPair.control;
                        triple.controlOut = newMirrorControlPoint(triple.point, triple.controlIn);

                        tangentPointTriples.push(triple);
                    }

                    return tangentPointTriples;
                }

                let tangentPairsClone = [];
                for(let i = 0; i < tangentPairs.length; ++i)
                {
                    tangentPairsClone.push(pairClone(tangentPairs[i]));
                }

                shiftPoints(tangentPairsClone, shift);

                let shiftedTangentPointTriples = getTangentPointTriples(tangentPairsClone);

                return shiftedTangentPointTriples;
            }

            function rotateEndControls(pointTuples)
            {
                const angle = 5;

                let firstPair = pointTuples[0], // rotate control point anticlockwise
                    lastPair = pointTuples[pointTuples.length - 1], // rotate control point clockwise
                    firstPoint = firstPair.point,
                    firstControl = firstPair.control,
                    lastPoint = lastPair.point,
                    lastControl = lastPair.control;

                firstControl.rotate(firstPoint, -angle);
                lastControl.rotate(lastPoint, angle);
            }

            // returns a pointPair sequence that includes the start and end points.
            function getUpperPointsSequence(templatePointPairs, shiftUp)
            {
                // move the tangent points and control points outwards
                let upperPointTuples = getShiftedTangentPointTriples(templatePointPairs.tangentPairs, shiftUp);

                upperPointTuples.splice(0, 0, pairClone(templatePointPairs.startPair));
                upperPointTuples.push(pairClone(templatePointPairs.endPair));

                rotateEndControls(upperPointTuples);
                
                return upperPointTuples;
            }

            // returns a reversed pointPair sequence that includes the start and end points.
            function getLowerPointsSequence(templatePointPairs, shiftDown)
            {
                function reverse(pointTuples)
                {
                    let reversedTuples = [];

                    for(let i = pointTuples.length - 1; i >= 0; --i)
                    {
                        let tuple = pointTuples[i],
                            temp = tuple.controlIn;

                        tuple.controlIn = tuple.controlOut;
                        tuple.controlOut = temp;

                        reversedTuples.push(tuple);
                    }

                    return reversedTuples;
                }

                // move the tangent points and control points inwards
                let lowerPointTuples = getShiftedTangentPointTriples(templatePointPairs.tangentPairs, shiftDown);

                lowerPointTuples = reverse(lowerPointTuples);

                lowerPointTuples.splice(0, 0, pairClone(templatePointPairs.endPair));
                lowerPointTuples.push(pairClone(templatePointPairs.startPair));

                rotateEndControls(lowerPointTuples);

                return lowerPointTuples;
            }

            // The arguments and returned string all use absolute coordinates.
            function getDStr(upperPointTuples, lowerPointTuples)
            {
                function join(upperPointTuples, lowerPointTuples)
                {
                    let joint = {};

                    joint.point = upperPointTuples[upperPointTuples.length - 1].point;
                    joint.controlIn = upperPointTuples[upperPointTuples.length - 1].control;
                    joint.controlOut = lowerPointTuples[0].control;

                    upperPointTuples[upperPointTuples.length - 1] = joint;
                    lowerPointTuples.splice(0, 1);
                    let joinedTuples = upperPointTuples.concat(lowerPointTuples);

                    return joinedTuples;
                }

                if(upperPointTuples.length < 3)
                {
                    throw "Doing long slurs here!";
                }

                let dStr = "M",
                    tuples = join(upperPointTuples,lowerPointTuples);
                
                dStr = dStr + getCoordinateString(tuples[0].point) + "C";
                dStr += getCoordinateString(tuples[0].control) + ",";
                dStr += getCoordinateString(tuples[1].controlIn) + ",";
                dStr += getCoordinateString(tuples[1].point) + ",";
                for(let i = 2; i < tuples.length - 1; ++i)
                {
                    dStr += getCoordinateString(tuples[i-1].controlOut) + ",";
                    dStr += getCoordinateString(tuples[i].controlIn) + ",";
                    dStr += getCoordinateString(tuples[i].point) + ",";
                }
                dStr += getCoordinateString(tuples[tuples.length - 2].controlOut) + ",";
                dStr += getCoordinateString(tuples[tuples.length - 1].control) + ",";
                dStr += getCoordinateString(tuples[tuples.length - 1].point) + "z"; 

                return dStr;
            }

            let halfLongSlurWidth = templateStrokeWidth * 0.4,
                upperPointTuples = getUpperPointsSequence(templatePointPairs, -halfLongSlurWidth),
                lowerPointTuples = getLowerPointsSequence(templatePointPairs, halfLongSlurWidth),
                dStr = getDStr(upperPointTuples, lowerPointTuples);

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
                //dStr = getShortSlurDStr(templatePointPairs, templateStrokeWidth);
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
