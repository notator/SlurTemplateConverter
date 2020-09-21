
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

    // Returns the intersection point between this line and line2.
    // The returned intersection point can be outside the defined line segments, because
    // they are treated as infinitely long lines, defined by the known end-points. 
    // Returns Point(Number.MAX_VALUE, Number.MAX_VALUE) if the two lines are parallel.
    // Algorithm found at: https://www.geeksforgeeks.org/program-for-point-of-intersection-of-two-lines/
    //     Let the given lines be:
    //         a1x + b1y = c1
    //         a2x + b2y = c2
    //     Solve these 2 equations to find the point of intersection:
    //         Multiplying line 1 by b2 and line 2 by b1 gives
    //             a1b2x + b1b2y = c1b2 and
    //             a2b1x + b2b1y = c2b1
    //         Subtracting these gives
    //             (a1b2 – a2b1) x = c1b2 – c2b1 or
    //             x = (c1b2 – c2b1) / (a1b2 – a2b1)
    //         Similarly
    //             y = (a1c2 - a2c1) / (a1b2 – a2b1)    
    intersectionPoint(line2)
    {
        let pA = point1,
            pB = point2,
            pC = line2.point1,
            pD = line2.point2,
            // Line AB is a1x + b1y = c1  
            a1 = pB.y - pA.y,
            b1 = pA.x - pB.x,
            c1 = (a1 * pA.x) + (b1 * pA.y),
            // Line CD is a2x + b2y = c2  
            a2 = pD.y - pC.y,
            b2 = pC.x - pD.x,
            c2 = (a2 * pC.x) + (b2 * pC.y),

            divisor = (a1 * b2) - (a2 * b1);

        let returnPoint = null;

        if(divisor == 0)
        {
            // The lines are parallel.
            returnPoint = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
        }
        else
        {
            let x = ((b2 * c1) - (b1 * c2)) / divisor;
            let y = ((a1 * c2) - (a2 * c1)) / divisor;

            returnPoint = new Point(x, y);
        }        

        return returnPoint;
    }
}
