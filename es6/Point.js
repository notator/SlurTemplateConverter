

export class Point
{
    constructor(x, y)
	{
        this._x = x;
        this._y = y;
	}

    getX() 
    {
        return this._x;
    }

    getY()
    {
        return this._y;
    }

    // Moves this point by adding dx and dy to its coordinates.
    move(dx, dy) 
    {
        this._x += dx;
        this._y += dy;
    }

    // Moves this point by rotating it around origin (a Point) by degrees (a Number) degrees.
    rotate(origin, degrees) 
    {
        let deltaX = this._x - origin.getX(),
            deltaY = this._y - origin.getY(),
            rotateRadians = degrees / (2 * Math.PI),
            currentRadians = Math.atan(deltaY / deltaX),
            totalRadians = rotateRadians + currentRadians,
            hypotenuse = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)),
            newX = origin.getX() + (hypotenuse * Math.cos(totalRadians)),
            newY = origin.getY() + (hypotenuse * Math.sin(totalRadians));

        this._x = newX;
        this._y = newY;
    }
}
