var scketch = function(p){

  var particleNum = 10;
  var particle;
  var particles = [];
  var pixels = [];
  var img;


  /*

  particleクラス
  --------------------------------------------------------*/
  var Particle = function(pos,v,d,c){
    this.p = pos;
    this.temp_p = this.p.copy();
    this.defaultPos = this.p.copy();
    this.v = v;
    this.a = p.createVector(0,0);
    this.d = d;
    this.r = d/2;
    this.color = c;
    this.mass = this.r * 0.2;
    this.noise_x = p.random(1000);
    this.noise_y = p.random(1000);
  }
  Particle.prototype.addForce = function(f){
    this.a.add(f);
    this.a.div(this.mass);
  }
  Particle.prototype.update = function(){
    this.v.add(this.a);
    this.p.add(this.v);
    this.a.mult(0);
  }
  Particle.prototype.walk = function(){
    this.noise_x += 0.01;
    this.noise_y += 0.01;
    var force = p.createVector(0,0);
    var to = p.createVector(p.noise(this.noise_x)*this.d*2-this.d,p.noise(this.noise_y)*this.d*2-this.d);
    this.temp_p = p5.Vector.add(this.p,to);
    var toTempPos = p5.Vector.sub(this.temp_p,this.p);
    force = p5.Vector.mult(toTempPos,0.02);
    this.addForce(force);
  }
  Particle.prototype.attract = function(){
    var radius = 600;
    var mouse;
    if(p.touchIsDown){
      mouse = p.createVector(p.touchX,p.touchY);
    }else{
      mouse = p.createVector(p.mouseX,p.mouseY);
    }
    var dist = p5.Vector.dist(mouse,this.p);
    if(dist > 0 && dist < radius){
      var force = p.createVector(0,0);
      var toMouse = p5.Vector.sub(mouse,this.p);
      toMouse.normalize();
      var s = dist/radius;
      var amp = 0.08;
      var strength = 60;
      var power = (1/p.pow(s,0.5*amp)) - 1;
      power *= strength;
      force = p5.Vector.mult(toMouse,power);
      this.addForce(force);
    }
  }
  Particle.prototype.returnPos = function(){
    var force = p.createVector(0,0);
    var toDefault = p5.Vector.sub(this.defaultPos,this.p);
    force = p5.Vector.mult(toDefault,0.03);
    this.addForce(force);
  }
  Particle.prototype.draw = function(){
    p.noStroke();
    //gradation
    var grad  = p.drawingContext.createRadialGradient(this.p.x,this.p.y,0,this.p.x,this.p.y,this.r);
    grad.addColorStop(1,'rgba(0, 0, 0, 0)');
    grad.addColorStop(0,'rgba(' + this.color.levels[0] + ',' + this.color.levels[1] + ',' + this.color.levels[2] + ','+ this.color.levels[3] +')');
    p.drawingContext.fillStyle = grad;
    //p.fill(this.color);
    p.ellipse(this.p.x,this.p.y,this.d,this.d);
  }






  /*

  p5　フレームワーク
  --------------------------------------------------------*/
  p.setup = function(){
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.blendMode(p.ADD);
    p.background(0);
    init();

    //console.log(particles.length);

  }

  p.draw = function(){
    p.clear();
    p.background(0);

    for(var i=0; i<particles.length; i++){
      particles[i].walk();
      if (p.mouseIsPressed || p.touchIsDown){
        particles[i].attract();
      } else{
        particles[i].returnPos();
      }
      particles[i].v.mult(0.9);
      particles[i].update();
      particles[i].draw();
    }

    //frame rate
    // p.fill(255);
    // p.textSize(18);
    // p.text('fps: '+ p.floor(p.frameRate(),10), 10, 30);

  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    particles = [];
    init();
  }




  function init(){

    var radius;
    if(p.windowWidth > p.windowHeight ){
      radius = p.windowHeight * 0.4;
    }else{
      radius = p.windowWidth * 0.4;
    }

    for(var i=0; i<particleNum; i++){
      var t = p.map(i,0,particleNum,0,p.TWO_PI);
      var x = p.sin(t*2+p.radians(90))*p.cos(t*8)*(radius) + p.windowWidth/2;
      var y = p.sin(t*2+p.radians(0))*p.cos(t*8)*(radius) + p.windowHeight/2;
      var pos = p.createVector(x,y);
      var randompos = p.createVector(p.random(-5,5),p.random(-5,5));
      pos.add(randompos);
      var v = p.createVector(0,0);
      var c = p.color(p.random(50,255),p.random(50,255),p.random(50,255),255);
      var size = p.random(2,30);
      var particle = new Particle(pos,v,size,c);
      particles.push(particle);
    }

  }



}




new p5(scketch);
