
import { Point } from "./Point.js";

export class Line
{
    constructor(point1: Point, point2: Point)
	{
        this._point1 = new Point(point1.getX(), point1.getY());
        this._point2 = new Point(point2.getX(), point2.getY());
    }

    clone(): Line
    {
        return new Line(_point1, point2);
    }

    move(dx: Number, dy: Number): void
    {
        _point1.move(dx, dy);
        _point2.move(dx, dy);
    }

    rotate(origin: Point, degrees: Number) : void
    {
        _point1.rotate(origin, degrees);
        _point2.rotate(origin, degrees);
    }

    length(): Number
    {
        let deltaX = _point2.getX() - _point1.getX(),
            deltaY = _point2.getY() - _point1.getY();

        return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)),
    }

    // Returns true if this line (segment) is on or above the given point, otherwise false.
    // Note that this function returns false if the point is outside the line's x-range.
    isOnOrAbove(point: Point): boolean
    {
        let linePoint1x = _point1.getX(),
            linePoint2x = _point2.getX(),
            lineXMax = 0,
            lineXMin = 0;

        if(linePoint1x <= linePoint2x)
        {
            lineXMin = linePoint1x;
            lineXMax = linePoint2x;
        }
        else
        {
            lineXMin = linePoint2x;
            lineXMax = linePoint1x;
        }

        let linePoint1y = _point1.getY(),
            linePoint2y = _point2.getY(),
            px = point.getX(),
            py = point.getY(),
            lineYMax = (linePoint1y >= linePoint2y) ? linePoint1y : linePoint2y,
            lineSlope = (lineYMax - lineYMin) / (lineXMax - lineXMin),
            lineYatPX = lineYMax - ((lineXMax - px) * lineSlope),
            rVal = false; 

        if(px >= lineXMin && px <= lineXMax && py <= lineYatPX)
        {
            rVal = true;
        }

        return rVal;
    }

    joinsOrIntersects(line: Line): boolean
    {

    }

    // The returned point is accurate to three decimal places.
    // Returns null if the two lines (=line seqments) don't intersect.
    intersectionPoint(line2: Line): Point
    {
        let halfwayPoint = new Point(((_point1.getX() + this._point2.getX) / 2), ((_point1.getX() + this._point2.getX) / 2));




    }
}
