

export class Point
{
    constructor(x, y)
	{
        this._x = x;
        this._y = y;
	}

    getX() 
    {
        return _x;
    }

    getY()
    {
        return _y;
    }

    // Moves this point by adding dx and dy to its coordinates.
    move(dx, dy) 
    {
        _x += dx;
        _y += dy;
    }

    // Moves this point by rotating it around origin (a Point) by degrees (a Number) degrees.
    rotate(origin, degrees) 
    {
        let deltaX = _x - origin.getX(),
            deltaY = _y - origin.getY(),
            rotateRadians = degrees / (2 * Math.PI),
            currentRadians = Math.atan(deltaY / deltaX),
            totalRadians = rotateRadians + currentRadians,
            hypotenuse = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)),
            newX = origin.getX() + (hypotenuse * Math.cos(totalRadians)),
            newY = origin.getY() + (hypotenuse * Math.sin(totalRadians));

        _x = newX;
        _y = newY;
    }
}
