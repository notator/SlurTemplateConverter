
import { Point } from "./Point.js";

export class Line
{
    constructor(point0, point1)
	{
        this.point0 = new Point(point0.x, point0.y);
        this.point1 = new Point(point1.x, point1.y);
    }

    clone()
    {
        return new Line(this.point0.clone(), this.point1.clone());
    }

    slope()
    {
        let m = ((this.point1.y - this.point0.y) / (this.point1.x - this.point0.x));
        return m;
    }

    midPoint()
    {
        return new Point(((this.point0.x + this.point1.x) / 2), ((this.point0.y + this.point1.y) / 2));
    }

    // Moves this line's end-points by dx, dy.
    move(dx, dy)
    {
        this.point0.move(dx, dy);
        this.point1.move(dx, dy);
    }

    // Moves both end points by delta units, so that
    // this line moves to a parallel line that is at
    // a distance of delta units from the original position.
    moveParallel(delta)
    {
        let slope = this.slope(),
            radians = Math.atan(slope),
            dx = -delta * Math.sin(radians),
            dy = delta * Math.cos(radians);
        
        this.point0.move(dx, dy);
        this.point1.move(dx, dy);
    }

    // Moves both end points in parallel, so that this line passes through point.
    // (Centres the line on the point.)
    shiftToPoint(point)
    {
        let midPoint = this.midPoint(),
            dx = point.x - midPoint.x,
            dy = point.y - midPoint.y;

        this.point0.move(dx, dy);
        this.point1.move(dx, dy);
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
        let pA = this.point0,
            pB = this.point1,
            pC = line2.point0,
            pD = line2.point1,
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

        if(divisor === 0)
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
