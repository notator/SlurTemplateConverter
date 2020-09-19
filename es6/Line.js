
import { Point } from "./Point.js";

export class Line
{
    constructor(point1, point2)
	{
        this.point1 = new Point(point1.getX(), point1.getY());
        this.point2 = new Point(point2.getX(), point2.getY());
    }

    clone()
    {
        return new Line(point1, point2);
    }

    move(dx, dy)
    {
        point1.move(dx, dy);
        point2.move(dx, dy);
    }

    rotate(origin, degrees) 
    {
        point1.rotate(origin, degrees);
        point2.rotate(origin, degrees);
    }

    length()
    {
        let deltaX = point2.getX() - point1.getX(),
            deltaY = point2.getY() - point1.getY();

        return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    // Returns true if this line (segment) is on or above the given point, otherwise false.
    // Note that this function returns false if the point is outside the line's x-range.
    isOnOrAbove(point)
    {
        let linePoint1x = point1.getX(),
            linePoint2x = point2.getX(),
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

        let linePoint1y = point1.getY(),
            linePoint2y = point2.getY(),
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

    // See https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
    // But note that this version only returns true if there is a single intersection point.
    // It returns false if the lines are colinear.
    joinsOrIntersects(line)
    {
        // To find orientation of ordered triplet (p, q, r). 
        // The function returns following values 
        // 0 --> p, q and r are colinear 
        // 1 --> Clockwise 
        // 2 --> Counterclockwise 
        function orientation(p , q , r ) 
        { 
            let val = ((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y));

            if(val == 0) return 0;  // colinear 

            return (val > 0) ? 1 : 2; // clockwise or counterclockwise 
        } 

        let a = point1,
            b = point2,
            c = line.point1,
            d = line.point2,
            rval = false;

        if(a.isEqual(c) || a.isEqual(d) || b.isEqual(c) || b.isEqual(d))
        {
            rval = true; // joins
        }
        else
        {
            // Find the four orientations
            let o1 = orientation(p1, q1, p2),
                o2 = orientation(p1, q1, q2),
                o3 = orientation(p2, q2, p1),
                o4 = orientation(p2, q2, q1),
                colinear = (o1 == 0 || o2 == 0 || o3 == 0 || o4 == 0);

            if(colinear == false && o1 != o2 && o3 != o4)
            {
                rval = true;
            }
        }

        return rval;
    }

    // Returns the end-point having the smaller x-coordinate, or
    // point1 if the x-coordinates are equal.
    minXPoint()
    {
        return (point1.getX() <= point2.getX()) ? point1 : point2;
    }
    // Returns the end-point having the larger x-coordinate, or
    // point1 if the x-coordinates are equal.
    maxXPoint()
    {
        return (point1.getX() >= point2.getX()) ? point1 : point2;
    }

    // The returned point is accurate to three decimal places.
    // Returns null if the two lines (=line seqments) don't intersect.
    intersectionPoint(line2)
    {
        let returnPoint = null;

        if(this.joinsOrIntersects(line2))
        {
            let halfwayPoint = new Point(((point1.getX() + point2.getX()) / 2), ((point1.getY() + point2.getY()) / 2)),
                lineSeg = this;

            returnPoint = point1;                

            while(halfwayPoint.isNear(returnPoint, 0.001) === false)
            {
                if(line2.isOnOrAbove(halfwayPoint))
                {
                    lineSeg = new Line(halfwayPoint, lineSeg.maxXPoint());
                }
                else
                {
                    lineSeg = new Line(lineSeg.minXPoint(), halfwayPoint);
                }
                returnPoint = halfwayPoint;
                halfwayPoint = new Point(((lineSeg.point1.getX() + lineSeg.point2.getX()) / 2), ((lineSeg.point1.getY() + lineSeg.point2.getY()) / 2));
            }
        }

        return returnPoint;
    }
}
