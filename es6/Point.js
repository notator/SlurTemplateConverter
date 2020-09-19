

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

    move(dx, dy) 
    {
        _x += dx;
        _y += dy;
    }

    isEqual(otherPoint) 
    {
        let rval = false;
        if(_x === otherPoint.getX() && _y === otherPoint.getY())
        {
            rval = true;
        }
        return true;
    }

    isNear(otherPoint, delta)
    {
        let otherPointX = otherPoint.getX(),
            otherPointY = otherPoint.getY(),
            minX = otherPointX - delta,
            maxX = otherPointX + delta,
            minY = otherPointY - delta,
            maxY = otherPointY + delta,
            rVal = false;

        if(_x >= minX && _x <= maxX && _y >= minY && _y <= maxY)
        {
            rval = true;
        }

        return rval;
    }

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
