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
    convertTemplates(svg) 
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
            let point = controlLine.point1.clone();
            point.rotate(controlLine.point0, angle);

            return new Line(controlLine.point0, point);
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
            function getTQPoints(tp0, tp1, tp2, tp3)
            {
                let tq0 = new Point((tp0.x + tp1.x) / 2, (tp0.y + tp1.y) / 2),
                    tq1 = new Point((tp1.x + tp2.x) / 2, (tp1.y + tp2.y) / 2),
                    tq2 = new Point((tp2.x + tp3.x) / 2, (tp2.y + tp3.y) / 2);

                return { tq0, tq1, tq2 };
            }

            function getTRPoints(tqPoints)
            {
                let tq0 = tqPoints.tq0,
                    tq1 = tqPoints.tq1,
                    tq2 = tqPoints.tq2,
                    tr0 = new Point((tq0.x + tq1.x) / 2, (tq0.y + tq1.y) / 2),
                    tr1 = new Point((tq1.x + tq2.x) / 2, (tq1.y + tq2.y) / 2);

                return { tr0, tr1 };
            }

            function getTBezierLines(tp0, tp1, tp2, tp3, tqPoints, trPoints)
            {
                let tpLine0 = new Line(tp0, tp1),
                    tpLine1 = new Line(tp1, tp2),
                    tpLine2 = new Line(tp2, tp3),
                    tqLine0 = new Line(tqPoints.tq0, tqPoints.tq1),
                    tqLine1 = new Line(tqPoints.tq1, tqPoints.tq2),
                    trLine = new Line(trPoints.tr0, trPoints.tr1);
                
                return { tpLine0, tpLine1, tpLine2, tqLine0, tqLine1, trLine }; 
            }

            function getControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth, isUpper)
            {
                const halfTemplateStrokeWidth = templateStrokeWidth / 2;    

                let rLine = tBezierLines.trLine.clone(),
                    qLine0 = tBezierLines.tqLine0.clone(),
                    qLine1 = tBezierLines.tqLine1.clone(),
                    controlPointsLine = tBezierLines.tpLine1.clone(),                    
                    q1;

                rLine.moveParallel((isUpper === true) ? -halfTemplateStrokeWidth : halfTemplateStrokeWidth);
                qLine0.shiftToPoint(rLine.point0);
                qLine1.shiftToPoint(rLine.point1);
                q1 = qLine0.intersectionPoint(qLine1);

                controlPointsLine.shiftToPoint(q1);                

                return controlPointsLine;
            }

            function getUpperControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth)
            {
                let upperControlPointsLine = getControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth, true);

                return upperControlPointsLine;
            }

            function getLowerControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth)
            {
                let lowerControlPointsLine = getControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth, false)

                return lowerControlPointsLine;
            }

            function getControlPoints(tBezierLines, tp1, tp2, upperControlPointsLine, lowerControlPointsLine)
            {
                let tpLine0 = tBezierLines.tpLine0, // points p0, p1 in that order (clockwise)
                    tpLine2 = tBezierLines.tpLine2, // points p2, p3 in that order (clockwise)
                    isOver = (tpLine0.point0.y > tpLine0.point1.y), // the template starts sloping upwards
                    tRadians = ((tp2.x - tp1.x) === 0) ? Math.PI / 2 : Math.atan((tp2.y - tp1.y) / (tp2.x - tp1.x)),
                    radiansLeft = (isOver === true) ? tRadians + Math.PI / 4 : tRadians - Math.PI / 4,
                    radiansRight = (isOver === true) ? tRadians - Math.PI / 4 : tRadians + Math.PI / 4,
                    leftIntersectorLine = new Line(tp1, new Point(tp1.x + (100 * Math.cos(radiansLeft)), tp1.y + (100 * Math.sin(radiansLeft)))),
                    isS_Template = ((tpLine0.point0.y > tpLine0.point1.y) === (tpLine2.point0.y > tpLine2.point1.y)),
                    radians = (isS_Template) ? radiansLeft : radiansRight,
                    rightIntersectorLine = new Line(tp2, new Point(tp2.x + (100 * Math.cos(radians)), tp2.y + (100 * Math.sin(radians)))),
                    upper = {},
                    lower = {};


                upper.p1 = upperControlPointsLine.intersectionPoint(leftIntersectorLine);
                upper.p2 = upperControlPointsLine.intersectionPoint(rightIntersectorLine);

                lower.p1 = lowerControlPointsLine.intersectionPoint(leftIntersectorLine);
                lower.p2 = lowerControlPointsLine.intersectionPoint(rightIntersectorLine);

                return { upper, lower };
            }

            // Both the arguments and the returned string are absolute coordinates.
            function getDStr(startPoint, outerCP1, outerCP2, endPoint, innerCP2, innerCP1)
            {
                const relX = startPoint.x,
                    relY = startPoint.y;

                let point1Str = getCoordinateString(startPoint),
                    outerCP1Str = getCoordinateString(outerCP1),
                    outerCP2Str = getCoordinateString(outerCP2),
                    point2Str = getCoordinateString(endPoint),
                    innerCP2Str = getCoordinateString(innerCP2),
                    innerCP1Str = getCoordinateString(innerCP1),
                    dStr;

                dStr = "M" + point1Str + "C" + outerCP1Str + "," + outerCP2Str + "," + point2Str + "C" + innerCP2Str + "," + innerCP1Str + "," + point1Str + "z";

                return dStr;
            }

            const tp0 = templatePointPairs.startPair.point,
                tp1 = templatePointPairs.startPair.control,
                tp2 = templatePointPairs.endPair.control,
                tp3 = templatePointPairs.endPair.point,
                tqPoints = getTQPoints(tp0, tp1, tp2, tp3),
                trPoints = getTRPoints(tqPoints),
                tBezierLines = getTBezierLines(tp0, tp1, tp2, tp3, tqPoints, trPoints),
                upperControlPointsLine = getUpperControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth),
                lowerControlPointsLine = getLowerControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth),
                controlPoints = getControlPoints(tBezierLines, tp1, tp2, upperControlPointsLine, lowerControlPointsLine),

                dStr = getDStr(tp0, controlPoints.upper.p1, controlPoints.upper.p2, tp3, controlPoints.lower.p2, controlPoints.lower.p1);

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

        function convertSlurTemplate(slurTemplate)
        {
            let templateStrokeWidth = getTemplateStrokeWidth(slurTemplate),
                templatePointPairs = getTemplatePointPairs(slurTemplate),
                parentElement = slurTemplate.parentElement,
                slur = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                dStr = "";

            //console.log("\n*** Template " + (i + 1).toString() + " ***");

            if(templatePointPairs.tangentPairs.length === 0)
            {
                dStr = getShortSlurDStr(templatePointPairs, templateStrokeWidth);
            }
            else
            {
                //dStr = getShortSlurDStr(templatePointPairs, templateStrokeWidth);
                dStr = getLongSlurDStr(templatePointPairs, templateStrokeWidth);
            }

            slur.setAttribute('class', 'slur');
            slur.setAttribute('d', dStr);

            parentElement.insertBefore(slur, slurTemplate);
        }

        var slurTemplates = svg.getElementsByClassName("slurTemplate");

        for(let i = 0; i < slurTemplates.length; ++i)
        {
            convertSlurTemplate(slurTemplates[i]);
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
