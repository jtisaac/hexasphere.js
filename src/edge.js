var Point = require('./point');

var Edge = function(point1, point2){
    this.points = [point1, point2]

    this.owner = undefined;
}
