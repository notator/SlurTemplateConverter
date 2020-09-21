
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
            a1 = pB.getY() - pA.getY(),
            b1 = pA.getX() - pB.getX(),
            c1 = (a1 * pA.getX()) + (b1 * pA.getY()),
            // Line CD is a2x + b2y = c2  
            a2 = pD.getY() - pC.getY(),
            b2 = pC.getX() - pD.getX(),
            c2 = (a2 * pC.getX()) + (b2 * pC.getY()),

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
