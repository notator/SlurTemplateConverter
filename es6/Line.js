
import { Point } from "./Point.js";

export class Line
{
    constructor(point1, point2)
	{
        this.point1 = new Point(point1.x, point1.y);
        this.point2 = new Point(point2.x, point2.y);
    }

    clone()
    {
        return new Line(this.point1.clone(), this.point2.clone());
    }

    // Moves this line's end-points by dx, dy.
    move(dx, dy)
    {
        this.point1.move(dx, dy);
        this.point2.move(dx, dy);
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
        let pA = this.point1,
            pB = this.point2,
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
