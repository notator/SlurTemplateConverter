

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
    rotate(origin, degrees) 
    {
        let deltaX = this.x - origin.x,
            deltaY = this.y - origin.y,
            rotateRadians = (degrees / 360) * (2 * Math.PI),
            currentRadians = Math.atan(deltaY / deltaX),
            totalRadians = rotateRadians + currentRadians,
            hypotenuse = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)),
            newX = origin.x + (hypotenuse * Math.cos(totalRadians)),
            newY = origin.y + (hypotenuse * Math.sin(totalRadians));

        this.x = newX;
        this.y = newY;
    }
}
