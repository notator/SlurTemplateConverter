

export class Point
{
    constructor(x: Number, y: Number)
	{
        this._x = x;
        this._y = y;
	}

    getX() : Number
    {
        return _x;
    }

    getY(): Number
    {
        return _y;
    }

    move(dx: Number, dy: Number) : void
    {
        _x += dx;
        _y += dy;
    }

    rotate(origin: Point, degrees: Number) : void
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
