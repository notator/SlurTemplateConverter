import { Point } from "./Point.js";
import { Line } from "./Line.js";

// Converts objects having class "slurTemplate" to objects of class 'slur'.
// The templates must use absolute coordinates in their path.d attributes.
export class Converter
{
    constructor()
    {
    }

    // Returns the svg in which "slurTemplate" or "tieTemplate" paths have been replaced by their equivalent "slur" or "tie" 
    // A short slur or tie template is a path having two end points, each of which has a control point.
    // A long slur or tie template is a path having an additional tangent point between the end points.
    // The path.class attribute must be set to "slurTemplate" or "tieTemplate" which defines which object type is to be created.
    // The path attributes (stroke-width etc.) are defined locally in the path.
    // The path.d string must contain absolute coordinates (i.e. use 'M', 'C' and 'S', not 'c' and 's').
    // A path having class "slur" or "tie" replaces each original template at the same position in the svg.
    // The ="slur" and "tie" CSS definitions already exist globally in the svg. 
    convertTemplates(svg) 
    {
        function addConvertedSlursAndTies()
        {
            function convertTemplate(template, slurOrTieString)
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
                //    .tangentPair
                // Each Pair is an object having two Points: point and control.
                // For example:
                //     templatePointPairs.startPair.point
                //     templatePointPairs.tangentPair.control
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
                                    throw "Relative path coordinates are not allowed.";
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

                        if(points.length === 6)
                        {
                            pointPairs.tangentPair = {};
                            pointPairs.tangentPair.control = points[2];
                            pointPairs.tangentPair.point = points[3];
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

                function getCoordinateString(point)
                {
                    let xStr, yStr;

                    point.round(1);
                    xStr = point.x.toString();
                    yStr = point.y.toString();

                    return xStr + "," + yStr;
                }

                // Returns the string that is going to be the short slur or tie's d-attribute.
                function getShortDStr(templatePointPairs, templateStrokeWidth)
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
                        let lowerControlPointsLine = getControlPointsLine(tp1, tp2, tBezierLines, templateStrokeWidth, false);

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

                // Returns the string that is going to be the long slur or tie's d-attribute.
                function getLongDStr(templatePointPairs, templateStrokeWidth)
                {
                    function pairClone(pointPair)
                    {
                        let pointClone = pointPair.point.clone(),
                            controlClone = pointPair.control.clone();

                        return { point: pointClone, control: controlClone };
                    }

                    // Returns a tangent point triple object having point, controlIn, and controlOut members.
                    // Algorithm:
                    // 1. clone the tangentPair, and shift the clone by shift units at right angles to itself.
                    // 2. create the triple, setting 
                    //        triple.point = clone.point
                    //        triple.controlIn = clone.control
                    //        triple.controlOut = the mirror of triple.controlIn about triple.point
                    function getShiftedTangentPointTriple(tangentPair, shift)
                    {
                        function shiftPoints(pointsPair, shift)
                        {
                            let cPoint = pointsPair.control,
                                pPoint = pointsPair.point,
                                xShift = 0,
                                yShift = shift;

                                cPoint.move(xShift, yShift);
                                pPoint.move(xShift, yShift);
                        }

                        function getTangentPointTriple(tangentPair)
                        {
                            function newMirrorControlPoint(point, controlIn)
                            {
                                let xDiff = point.x - controlIn.x,
                                    yDiff = point.y - controlIn.y,
                                    controlOut = new Point(point.x + xDiff, point.y + yDiff);

                                return controlOut;
                            }

                            let tangentPointTriple = {};
                            tangentPointTriple.point = tangentPair.point;
                            tangentPointTriple.controlIn = tangentPair.control;
                            tangentPointTriple.controlOut = newMirrorControlPoint(tangentPair.point, tangentPair.control);

                            return tangentPointTriple;
                        }

                        let tangentPairClone = pairClone(tangentPair);

                        shiftPoints(tangentPairClone, shift);

                        let shiftedTangentPointTriple = getTangentPointTriple(tangentPairClone);

                        return shiftedTangentPointTriple;
                    }

                    function shiftTieEndControls(pointTuples, shift)
                    {
                        pointTuples[0].control.x -= shift;
                        pointTuples[0].control.y += shift;
                        pointTuples[2].control.x += shift;
                        pointTuples[2].control.y += shift;
                    }

                    function rotateSlurEndControls(pointTuples)
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
                    function getUpperPointsSequence(templatePointPairs, shiftUp, isTie)
                    {                        
                        let upperPointTuples = [],
                            tangentPointTriple = getShiftedTangentPointTriple(templatePointPairs.tangentPair, shiftUp);

                        upperPointTuples.push(pairClone(templatePointPairs.startPair));
                        upperPointTuples.push(tangentPointTriple);
                        upperPointTuples.push(pairClone(templatePointPairs.endPair));

                        if(isTie === true)
                        {
                            shiftTieEndControls(upperPointTuples, shiftUp);
                        }
                        else
                        {
                            rotateSlurEndControls(upperPointTuples);
                        }

                        return upperPointTuples;
                    }

                    // returns a reversed pointPair sequence that includes the start and end points.
                    function getLowerPointsSequence(templatePointPairs, shiftDown, isTie)
                    {
                        function reverse(tangentPointTriple)
                        {
                            let temp = tangentPointTriple.controlIn;

                            tangentPointTriple.controlIn = tangentPointTriple.controlOut;
                            tangentPointTriple.controlOut = temp;

                            return tangentPointTriple;
                        }

                        
                        let lowerPointTuples = [],
                            tangentPointTriple = getShiftedTangentPointTriple(templatePointPairs.tangentPair, shiftDown);

                        tangentPointTriple = reverse(tangentPointTriple);

                        lowerPointTuples.push(pairClone(templatePointPairs.endPair));
                        lowerPointTuples.push(tangentPointTriple);
                        lowerPointTuples.push(pairClone(templatePointPairs.startPair));

                        if(isTie === true)
                        {
                            shiftTieEndControls(lowerPointTuples, shiftDown);
                        }
                        else
                        {
                            rotateSlurEndControls(lowerPointTuples);
                        }

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
                            tuples = join(upperPointTuples, lowerPointTuples);

                        dStr = dStr + getCoordinateString(tuples[0].point) + "C";
                        dStr += getCoordinateString(tuples[0].control) + ",";
                        dStr += getCoordinateString(tuples[1].controlIn) + ",";
                        dStr += getCoordinateString(tuples[1].point) + ",";
                        for(let i = 2; i < tuples.length - 1; ++i)
                        {
                            dStr += getCoordinateString(tuples[i - 1].controlOut) + ",";
                            dStr += getCoordinateString(tuples[i].controlIn) + ",";
                            dStr += getCoordinateString(tuples[i].point) + ",";
                        }
                        dStr += getCoordinateString(tuples[tuples.length - 2].controlOut) + ",";
                        dStr += getCoordinateString(tuples[tuples.length - 1].control) + ",";
                        dStr += getCoordinateString(tuples[tuples.length - 1].point) + "z";

                        return dStr;
                    }

                    let halfLongSlurWidth = templateStrokeWidth * 0.4,
                        upperPointTuples = getUpperPointsSequence(templatePointPairs, -halfLongSlurWidth, true),
                        lowerPointTuples = getLowerPointsSequence(templatePointPairs, halfLongSlurWidth, true),
                        dStr = getDStr(upperPointTuples, lowerPointTuples);

                    return dStr;
                }

                // Make the template horizontal and symmetric.
                function normalizeTiePointPairs(templatePointPairs)
                {
                    var p1 = templatePointPairs.startPair.point,
                        p2 = templatePointPairs.startPair.control,
                        p3 = templatePointPairs.endPair.control,
                        p4 = templatePointPairs.endPair.point,
                        height = (p2.y - p1.y) > 0 ? (p2.y - p1.y) : (p1.y - p2.y),
                        tp, tc;
                    
                    if(templatePointPairs.tangentPair === undefined)
                    {                        
                        // p1.x, p1.y, p2y and p4x are constant
                        // p2.y defines the height of the tie
                        p2.x = p1.x + height; // 45°
                        // p2.y is constant
                        // p4.x is constant
                        p4.y = p1.y;
                        p3.x = p4.x - height; // 45°
                        p3.y = p2.y;
                    }
                    else // three points with three control points
                    {
                        // p1.x, p1.y, tp.y and p4x are constant
                        // tp.y defines the height of the tie
                        tp = templatePointPairs.tangentPair.point;
                        tc = templatePointPairs.tangentPair.control;
                        height = (tp.y - p1.y) > 0 ? (tp.y - p1.y) : (p1.y - tp.y),
                        // p1.x and p1.y are constant
                        p2.x = p1.x + height; // 45°
                        p2.y = tp.y;

                        tc.x = p2.x + (height / 2);
                        tc.y = p2.y;

                        tp.x = (p1.x + p4.x) / 2;
                        // tp.y is constant

                        // p4.x is constant
                        p4.y = p1.y;

                        p3.x = p4.x - height; // 45°
                        p3.y = tp.y;
                    }

                    return templatePointPairs;
                }

                let templateStrokeWidth = getTemplateStrokeWidth(template),
                    templatePointPairs = getTemplatePointPairs(template),
                    parentElement = template.parentElement,
                    path = document.createElementNS("http://www.w3.org/2000/svg", "path"),
                    dStr = "";

                //console.log("\n*** Template " + (i + 1).toString() + " ***");
                if(slurOrTieString === "tie")
                {
                    templatePointPairs = normalizeTiePointPairs(templatePointPairs);
                }

                if(templatePointPairs.tangentPair === undefined)
                {
                    dStr = getShortDStr(templatePointPairs, templateStrokeWidth);
                }
                else
                {
                    dStr = getLongDStr(templatePointPairs, templateStrokeWidth);
                }

                path.setAttribute('class', slurOrTieString);
                path.setAttribute('d', dStr);

                parentElement.insertBefore(path, template);
            }

            var slurTemplates = svg.getElementsByClassName("slurTemplate");

            for(let i = 0; i < slurTemplates.length; ++i)
            {
                convertTemplate(slurTemplates[i], 'slur');
            }

            var tieTemplates = svg.getElementsByClassName("tieTemplate");

            for(let i = 0; i < tieTemplates.length; ++i)
            {
                convertTemplate(tieTemplates[i], 'tie');
            }
        }

        function removeTemplates()
        {
            function removeTemplates(templates)
            {
                for(let i = templates.length - 1; i >= 0; --i)
                {
                    let template = templates[i],
                        parentElement = template.parentElement;

                    parentElement.removeChild(template);
                }
            }
            var slurTemplates = svg.getElementsByClassName("slurTemplate");
            var tieTemplates = svg.getElementsByClassName("tieTemplate");

            removeTemplates(slurTemplates);
            removeTemplates(tieTemplates);
        }

        addConvertedSlursAndTies();
        removeTemplates();

        return svg;
    }
}
