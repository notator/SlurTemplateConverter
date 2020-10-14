

export class Point
{
    constructor(x, y)
	{
        this.x = x;
        this.y = y;
	}

    clone()
    {
        return new Point(this.x, this.y);
    }

    // Moves this point by adding dx and dy to its coordinates.
    move(dx, dy) 
    {
        this.x += dx;
        this.y += dy;
    }

    // The distance between this point and point1
    distance(point1)
    {
        let dx = point1.x - this.x,
            dy = point1.y - this.y,
            distance = Math.sqrt((dx * dx) + (dy * dy));

        return distance;
    }

    // Rounds the values of x and y to the given number of decimal places.
    round(decimalPlaces)
    {
        let factor = Math.pow(10, decimalPlaces),
            x = this.x * factor,
            y = this.y * factor;

        x = Math.round(x);
        y = Math.round(y);

        this.x = x / factor;
        this.y = y / factor;
    }

    // Moves this point by rotating it around origin (a Point) by degrees (a Number) degrees.
    // If degrees is positive, rotation will be clockwise, otherwise anticlockwise.
    // Algorthm adapted from https://stackoverflow.com/questions/2259476/rotating-a-point-about-another-point-2d
    rotate(origin, degrees)
    {
        let radians = (degrees / 180) * Math.PI,
            sin = Math.sin(radians),
            cos = Math.cos(radians),
            x = this.x - origin.x, // move origin to 0,0
            y = this.y - origin.y, // move origin to 0,0
            newX = (x * cos) - (y * sin), // rotation
            newY = (x * sin) + (y * cos); // rotation

        this.x = newX + origin.x; // move origin back to origin.x,origin.y
        this.y = newY + origin.y; // move origin back to origin.x,origin.y
    }
}
