var Point = function(x,y,z){
    if(x !== undefined && y !== undefined && z !== undefined){
        this.x = x;
        this.y = y;
        this.z = z;

    }

    this.faces = [];
}

Point.prototype.midpoint = function(point){
    var newPoint = new Point();

    newPoint.x = (this.x + point.x)/2;
    newPoint.y = (this.y + point.y)/2;
    newPoint.z = (this.z + point.z)/2;

    return newPoint;
}

Point.prototype.project = function(radius, percent){
    if(percent == undefined){
        percent = 1.0;
    }

    percent = Math.max(0, Math.min(1, percent));
    var yx = this.y / this.x;
    var zx = this.z / this.x;
    var yz = this.z / this.y;

    var mag = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    var ratio = radius/ mag;

    this.x = this.x * ratio * percent;
    this.y = this.y * ratio * percent;
    this.z = this.z * ratio * percent;



    /*

    var newx = Math.sqrt(Math.pow(radius,2) / (1 + Math.pow(yx,2) + Math.pow(zx,2)));
    var newy = Math.sqrt((Math.pow(radius,2) - Math.pow(newx,2)) / (1 + Math.pow(yz,2)));
    var newz = Math.sqrt((Math.pow(radius,2) - Math.pow(newx,2) - Math.pow(newy,2)));

    this.x = newx;
    this.y = newy;
    this.z = newz;

    console.log(Math.sqrt(Math.pow(newx,2) + Math.pow(newy,2) + Math.pow(newz,2)));
   */

    return this;

};

Point.prototype.registerFace = function(face){
    this.faces.push(face);
}

Point.prototype.findCommonFace = function(other, notThisFace){
    for(var i = 0; i< this.faces.length; i++){
        for(var j = 0; j< other.faces.length; j++){
            if(this.faces[i].id === other.faces[j].id && this.faces[i].id !== notThisFace.id){
                return this.faces[i];
            }
        }
    }

    return null;
}

Point.prototype.toString = function(){
    return "" + this.x + "," + this.y + "," + this.z;

}

