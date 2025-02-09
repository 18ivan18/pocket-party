const UP_BOUND = 200;
const DOWN_BOUND = 880;
const FPS_CAP = 60;

const HEALTH_BAR_WIDTH = 420;
const HEALTH_BAR_HEIGHT = 48;

const MAX_BOSS_HEALTH = 100;
const EPSILON = 1e-6;

let moveUp = true;

const SHIP_PROJECTILE_URLS = ["./static/assets/extras/projectiles/projectile1.png", 
                                "./static/assets/extras/projectiles/projectile2.png", 
                                "./static/assets/extras/projectiles/projectile3.png", 
                                "./static/assets/extras/projectiles/projectile4.png"];

const BOSS_PROJECTILE_URLS = ["./static/assets/extras/projectiles/boss_projectile1.png", 
                                "./static/assets/extras/projectiles/boss_projectile2.png", 
                                "./static/assets/extras/projectiles/boss_projectile3.png", 
                                "./static/assets/extras/projectiles/boss_projectile4.png"];

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

let datafromServer;

class SpaceshipGame {
    constructor(canvasId) {
        this.tick = 0;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.backgroundImage = new Image();
        this.backgroundImage.src = "./static/assets/backgrounds/im3.png";

        this.ship = new Ship(new CollisionBox(200, 500, 10, 10), "./static/assets/Ship6/Ship6.png");
        this.shipIsVulnerable = true;
        this.shipIsVulnerableTimer = 0;
        this.deliverTheBoss = true;
        
        
        this.boss = new Boss(new CollisionBox(2000, 2000, 0, 0), "./static/assets/extras/boss/boss2.png");

        this.asteroids = [];
        this.projectiles = [];
        this.bossProjectiles = [];

        this.bossDeliverX = 1920;
        this.bossImage = new Image();
        this.bossImage.src = "./static/assets/extras/boss/boss2.png";
        this.angle = 0;

        this.victoryImage = new Image();
        this.defeatImage = new Image();

        this.victoryImage.src = "./static/assets/extras/victory.png";
        this.defeatImage.src = "./static/assets/extras/defeat.png";

        window.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener("keyup", this.handleKeyUp.bind(this));

        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

    }
  
    update() {
        const shipSpeed = 7;
        if (this.keys.ArrowUp) {
            this.moveShip(this.ship.collBox.x, this.ship.collBox.y - shipSpeed);
        }
        if (this.keys.ArrowDown) {
            this.moveShip(this.ship.collBox.x, this.ship.collBox.y + shipSpeed);
        }
        if (this.keys.ArrowLeft) {
            this.moveShip(this.ship.collBox.x - shipSpeed, this.ship.collBox.y);
        }
        if (this.keys.ArrowRight) {
            this.moveShip(this.ship.collBox.x + shipSpeed, this.ship.collBox.y);
        }


        let deleteAsteroidsIndexes = [];

        this.tick += 1;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.ship.lives <= 0) {
            this.ctx.drawImage(this.defeatImage, 535, 340);
        }
        else if (this.boss.health <= 0) {
            this.ctx.drawImage(this.victoryImage, 482, 340);
        }
        else if (this.tick <= 5 * FPS_CAP) {
                //Spawning and moving asteroids
            if (getRandomInt(100) <= 10) {
                for(let asteroid of this.createAsteroids()){
                    this.asteroids.push(asteroid);
                }               
            }          

            let deleteAsteroidsIndexes = []
            for (let asteroid of this.asteroids) {

                //console.log(asteroid.collBox.r);
                if (asteroid.removeCondition()) {
                    deleteAsteroidsIndexes.push(this.asteroids.indexOf(asteroid));
                }
                asteroid.draw(this.ctx);
                asteroid.rotation += asteroid.rotationSpeed;
                
                if (this.ship.collBox.collidesWith(asteroid.collBox)) {
                    console.log("collides");
                    deleteAsteroidsIndexes.push(this.asteroids.indexOf(asteroid));
                    if (this.shipIsVulnerable) {
                        this.ship.lives -= 1;
                        this.shipIsVulnerable = false;
                        this.shipIsVulnerableTimer = this.tick + 60;
                    }


                }
            }
            //console.log(this.asteroids.length);
            for (let index of deleteAsteroidsIndexes.reverse()) {
                this.asteroids.splice(index, 1);
            }

            this.moveShip(this.ship.collBox.x, this.ship.collBox.y);
            this.ship.draw(this.ctx);

        }
        else if (this.asteroids.length != 0) { 
            for (let asteroid of this.asteroids) {

                //console.log(asteroid.collBox.r);
                if (asteroid.removeCondition()) {
                    deleteAsteroidsIndexes.push(this.asteroids.indexOf(asteroid));
                }
                asteroid.draw(this.ctx);
                asteroid.rotation += asteroid.rotationSpeed;
                
                if (this.ship.collBox.collidesWith(asteroid.collBox)) {
                    console.log("collides");
                    deleteAsteroidsIndexes.push(this.asteroids.indexOf(asteroid));
                    if (this.shipIsVulnerable) {
                        this.ship.lives -= 1;
                        this.shipIsVulnerable = false;
                        this.shipIsVulnerableTimer = this.tick + 60;
                    }
                }
            }
            //console.log(this.asteroids.length);
            for (let index of deleteAsteroidsIndexes.reverse()) {
                this.asteroids.splice(index, 1);
            }
            this.moveShip(this.ship.collBox.x, this.ship.collBox.y);
            this.ship.draw(this.ctx);
        }
        else if(this.deliverTheBoss) {
            let rotation = 0.01;
            this.angle += rotation;
            console.log("deliver boss");
            this.ctx.drawImage(this.bossImage, this.bossDeliverX, 340);
            this.bossDeliverX -= 1;

            //rotateAsset(this.ctx, this.deliverTheBossx, 340, this.boss.collBox.width, this.boss.collBox.height, this.angle, this.bossImage);

            // this.ctx.save();  // Save context state for later restoration
            // this.ctx.translate(this.bossDeliverX + this.boss.collBox.width / 2, 340 + this.boss.collBox.height / 2);  // Translate to center
            // this.ctx.rotate(this.angle);  // Apply rotation
            // this.ctx.drawImage(this.bossImage, this.bossDeliverX + this.boss.collBox.width / 2, 340 + this.boss.collBox.height / 2);
            // this.ctx.restore();  // Restore context state`
            
            if (this.bossDeliverX <= 1200)
            {
                this.deliverTheBoss = false;
                this.boss.collBox.x = 1200;
                this.boss.collBox.y = 340;
            }

            this.moveShip(this.ship.collBox.x, this.ship.collBox.y);
            this.ship.draw(this.ctx);
        }
        else {
            console.log("boss time");
            //boss projectile spawning
            if ((this.tick + 10) % 120 == 0) {
                for(let projectile of this.createBossAttack(this.boss.collBox)) {
                    this.bossProjectiles.push(projectile);
                }
            }

            let deleteBossProjectilesIndexes = []
            for (let projectile of this.bossProjectiles) {

                //console.log(asteroid.collBox.r);
                if (projectile.removeCondition()) {
                    deleteBossProjectilesIndexes.push(this.bossProjectiles.indexOf(projectile));
                }

                projectile.draw(this.ctx);

                if (this.ship.collBox.collidesWith(projectile.collBox)) {
                    console.log("shoot boss collision");
                    deleteBossProjectilesIndexes.push(this.bossProjectiles.indexOf(projectile));
                    if (this.shipIsVulnerable) {
                        this.ship.lives -= 1;
                        this.shipIsVulnerable = false;
                        this.shipIsVulnerableTimer = this.tick + 60;
                    }
                }
                
                
            }

            for (let index of deleteBossProjectilesIndexes.reverse()) {
                this.bossProjectiles.splice(index, 1);
            }
            //boss
            this.boss.draw(this.ctx);
            this.boss.drawHealthBar(this.ctx);
            //spawn ship projectiles
            if (this.tick % 60 == 0) {
                this.projectiles.push(this.createShipProjectile(this.ship.collBox));
            }

            let deleteProjectilesIndexes = []
            for (let projectile of this.projectiles) {

                //console.log(asteroid.collBox.r);
                if (projectile.removeCondition()) {
                    deleteProjectilesIndexes.push(this.projectiles.indexOf(projectile));
                }
                projectile.draw(this.ctx);
                
                if (this.boss.collBox.collidesWith(projectile.collBox)) {
                    console.log("shoot boss collision");
                    deleteProjectilesIndexes.push(this.projectiles.indexOf(projectile));
                    this.boss.health -= 5;
                }
            }

            for (let index of deleteProjectilesIndexes.reverse()) {
                this.projectiles.splice(index, 1);
            }

            this.moveShip(this.ship.collBox.x, this.ship.collBox.y);
            this.ship.draw(this.ctx);

        
        }


        
        if (this.tick > this.shipIsVulnerableTimer)
            this.shipIsVulnerable = true;

        if (this.ship.collBox.collidesWith(this.boss.collBox)) {
            if (this.shipIsVulnerable) {
                this.ship.lives -= 1;
                this.shipIsVulnerable = false;
                this.shipIsVulnerableTimer = this.tick + 60;
            }
        }
            
    }
    
    start() {
        this.intervalId = setInterval(this.update.bind(this), 1000 / FPS_CAP);
        //window.addEventListener('keydown', this.moveShip); // Add event listener for keydown
    }
  
    stop() {
        clearInterval(this.intervalId);
        //window.removeEventListener('keydown', this.handleKeyDown); // Remove event listener for keydown
    }
  
    restart() {
        this.stop();
        this.start();
    }

    moveShip(x, y) {

        if (x < 0) {
            x = 0;
        } 
        else if (x + this.ship.collBox.width > CANVAS_WIDTH) {
            x = CANVAS_WIDTH - this.ship.collBox.width;
        }
    
        if (y < 0) {
            y = 0;
        } 
        else if (y + this.ship.collBox.height > CANVAS_HEIGHT) {
            y = CANVAS_HEIGHT - this.ship.collBox.height;
        }

        this.ship.collBox.x = x;
        this.ship.collBox.y = y;
        
        return;

        if (moveUp) {
            this.ship.collBox.x = x;
            this.ship.collBox.y = y - 1;
        }
        else {
            this.ship.collBox.x = x;
            this.ship.collBox.y = y + 1;
        }
        if (this.ship.collBox.y <= UP_BOUND || this.ship.collBox.y >= DOWN_BOUND) {
            moveUp = !moveUp;
        }
    }

    createAsteroids() {
        let n = getRandomInt(10) - 8;
        let asteroids = []
        if (n < 0)
            return asteroids;
        for(let i=0; i<n; i++) {
            asteroids.push(new Asteroid(new CollisionBox(2000, getRandomInt(1080 + 480) - 200, 0, 0), getRandomAsteroidURL(), 
                            getRandomInt(4,8), getRandomSign() * getRandomInt(2,8)/2));

        }
        return asteroids;
    }

    createShipProjectile(shipCollBox) {
        return new Projectile(new CollisionBox(shipCollBox.x + shipCollBox.width + 3, 
                                                             shipCollBox.y + shipCollBox.height / 2, 0, 0), SHIP_PROJECTILE_URLS);
    }

    createBossAttack(bossCollBox){
        let projectiles = [];
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "right"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "left"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "top"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "bottom"));
        
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "topleft"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "topright"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "bottomleft"));
        projectiles.push(new BossProjectile(new CollisionBox(bossCollBox.x + bossCollBox.width / 2, 
            bossCollBox.y + bossCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS, "bottomright"));
                    
        return projectiles;
        
    }

    //createBossProjectile(shipCollBox) {
    //    return new BossProjectile(new CollisionBox(shipCollBox.x + shipCollBox.width + 3, 
    //                                                         shipCollBox.y + shipCollBox.height / 2, 0, 0), BOSS_PROJECTILE_URLS);
    //}

    handleKeyDown(event) {
        // Update key states when keys are pressed
        switch (event.key) {
            case 'ArrowUp':
                this.keys.ArrowUp = true;
                break;
            case 'ArrowDown':
                this.keys.ArrowDown = true;
                break;
            case 'ArrowLeft':
                this.keys.ArrowLeft = true;
                break;
            case 'ArrowRight':
                this.keys.ArrowRight = true;
                break;
        }
    }

    handleKeyUp(event) {
        // Update key states when keys are released
        switch (event.key) {
            case 'ArrowUp':
                this.keys.ArrowUp = false;
                break;
            case 'ArrowDown':
                this.keys.ArrowDown = false;
                break;
            case 'ArrowLeft':
                this.keys.ArrowLeft = false;
                break;
            case 'ArrowRight':
                this.keys.ArrowRight = false;
                break;
        }
    }
    

    
}
  


window.onload = function() {
    const game = new SpaceshipGame('canvas', '#FF0000');
    game.start();
};



//animations!!!!!!!!!!
class Ship {
    constructor (collBox, imageURL) {
        this.collBox = collBox;  //CollisionBox(100, 100, settings.SHIP_WIDTH, settings.SHIP_HEIGHT);
        this.image = new Image();
        this.image.src = imageURL;


        this.image.onload = () => {
            this.collBox.width = this.image.naturalWidth;
            this.collBox.height = this.image.naturalHeight;
        }
        this.lives = 3;
        this.heartImage = new Image();
        this.heartImage.src = "./static/assets/extras/heart.png";

    }
    draw(ctx) {

        //console.log("img widht" + this.collBox.width);
        //console.log("img height" + this.collBox.height);

        ctx.drawImage(this.image, this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //ctx.fillStyle = "red";
        //ctx.fillRect(this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //drawing over the coll box using its topleft cords
        //ctx.drawImage(this.heartImage, 20, 20);
        //ctx.fillStyle = "red";
        for (let i = 0; i < this.lives; i++) {
            ctx.drawImage(this.heartImage, 60 + i * 70, 50);
            //ctx.fillRect(60 + i * 70, 50, 50, 50);
        }

    }
}

class Boss {
    constructor (collBox, imageURL) {
        this.collBox = collBox;  //CollisionBox(100, 100, settings.SHIP_WIDTH, settings.SHIP_HEIGHT);
        this.image = new Image();
        this.image.src = imageURL;
        
        this.dx = getRandomSign() * (getRandomInt(4) + 2);
        this.dy = getRandomSign() * (getRandomInt(4) + 2);


        this.image.onload = () => {
            this.collBox.width = this.image.naturalWidth;
            this.collBox.height = this.image.naturalHeight;
        }

        this.health = MAX_BOSS_HEALTH;
        this.healthBarWidth = HEALTH_BAR_WIDTH - 16;

    }
    draw(ctx, shipCollBox) {
        ctx.drawImage(this.image, this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //ctx.fillStyle = "red";
        //ctx.fillRect(this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //drawing over the coll box using its topleft cords
        this.collBox.x += this.dx;
        this.collBox.y += this.dy;

        const buffer = 10;
        if (this.collBox.x <= 50 || this.collBox.x >= 1520){
            this.dx = -signOf(this.dx) * (getRandomInt(5) + 3);
            this.collBox.x += this.dx > 0 ? buffer : -buffer;
            //this.dy = getRandomInt(11) - 6;
        }
        if (this.collBox.y <= 20 || this.collBox.y >= 680){
            this.dy = -signOf(this.dy) * (getRandomInt(5) + 3);
            //this.dx = getRandomInt(11) - 6;
            this.collBox.y += this.dy > 0 ? buffer : -buffer;
        }

    }

    drawHealthBar(ctx) {
        ctx.fillStyle = "grey";
        ctx.fillRect(1440, 50, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

        if (this.health > 70)
            ctx.fillStyle = "#33cc33";
        else if (this.health > 40)
            ctx.fillStyle = "#e6e600";
        else if (this.health > 20)
            ctx.fillStyle = "#ff9200";
        else if (this.health > 0)
            ctx.fillStyle = "#d90000";
        else
            return;
            


        ctx.fillRect(1448, 58, this.healthBarWidth, HEALTH_BAR_HEIGHT - 16);
        this.healthBarWidth = (this.health / MAX_BOSS_HEALTH) * (HEALTH_BAR_WIDTH - 16);


    }
}

class Asteroid {
    constructor (collBox, imageURL, dx, dy) {
        this.collBox = collBox;
        this.image = new Image();
        this.image.src = imageURL;
        this.dx = dx;
        this.dy = dy;
        this.rotation = 0;
        this.rotationSpeed = getRandomSign() * 0.01;
        
        this.image.onload = () => {
            this.collBox.width = this.image.naturalWidth;
            this.collBox.height = this.image.naturalHeight;
        }


    }

    draw(ctx) {
        
        //console.log("aster widht" + this.collBox.width);
        //console.log("aster height" + this.collBox.height);

        //ctx.drawImage(this.image, this.collBox.x, this.collBox.y);

        ctx.save();  // Save context state for later restoration
        ctx.translate(this.collBox.x + this.collBox.width / 2, this.collBox.y + this.collBox.height / 2);  // Translate to center
        ctx.rotate(this.rotation);  // Apply rotation
        ctx.drawImage(this.image, -this.collBox.width / 2, -this.collBox.height / 2);  // Draw image centered
        ctx.restore();  // Restore context state`
        

        //ctx.fillStyle = "red";
        //ctx.fillRect(this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);

        //drawing over the coll box using its topleft cords

        this.collBox.x -= this.dx;
        this.collBox.y += this.dy;
    }

    removeCondition() {
        return (this.collBox.x + this.collBox.width < 0 || 
                this.collBox.y + this.collBox.height + 400 < 0 || 
                this.collBox.y - this.collBox.height - 400 > CANVAS_HEIGHT)     
    }



}

class CollisionBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y; 
        this.width = width;
        this.height = height;


    }

    collidesWith(other) {
        return(this.x < other.x + other.width &&
            other.x < this.x + this.width &&
            this.y < other.y + other.height &&
            other.y < this.y + this.height);
    }
}

class Projectile {
    constructor (collBox, imageURLS) {
        this.imageURLS = imageURLS;
        this.collBox = collBox;  //CollisionBox(100, 100, settings.SHIP_WIDTH, settings.SHIP_HEIGHT);
        this.images = [];
        for (let i = 0; i < 4 ; i++) {
            this.images[i] = new Image();
            this.images[i].src = this.imageURLS[i];
        }
        this.counter = 0;


        this.images[1].onload = () => {
            this.collBox.width = this.images[1].naturalWidth;
            this.collBox.height = this.images[1].naturalHeight;
        }
        
    }
    draw(ctx) {
        ctx.drawImage(this.images[Math.floor((this.counter % 12) / 3)], this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        this.counter += 1;

        //ctx.fillStyle = "red";
        //ctx.fillRect(this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //drawing over the coll box using its topleft cords
        this.collBox.x += 10;
    }
    removeCondition() {
        return (this.collBox.x >= 2000 || this.collBox.x <= -100 || this.collBox.y >= 1100 || this.collBox.y <= -100);
    }


}

class BossProjectile {
    constructor (collBox, imageURLS, type) {
        this.imageURLS = imageURLS;
        this.collBox = collBox;  //CollisionBox(100, 100, settings.SHIP_WIDTH, settings.SHIP_HEIGHT);
        this.images = [];
        for (let i = 0; i < 4 ; i++) {
            this.images[i] = new Image();
            this.images[i].src = this.imageURLS[i];
        }
        this.counter = 0;
        this.type = type;


        this.images[1].onload = () => {
            this.collBox.width = this.images[1].naturalWidth;
            this.collBox.height = this.images[1].naturalHeight;
        }
        
    }
    draw(ctx) {
        ctx.drawImage(this.images[Math.floor((this.counter % 12) / 3)], this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        this.counter += 1;

        //ctx.fillStyle = "red";
        //ctx.fillRect(this.collBox.x, this.collBox.y, this.collBox.width, this.collBox.height);
        //drawing over the coll box using its topleft cords
        if (this.type == "left")
            this.collBox.x -= 7;
        else if (this.type == "right")
            this.collBox.x += 7;
        else if (this.type == "top")
            this.collBox.y -= 7;
        else if (this.type == "bottom")
            this.collBox.y += 7;
        else if (this.type == "topleft") {
            this.collBox.x -= 5;
            this.collBox.y -= 5;
        }
        else if (this.type == "topright") {
            this.collBox.x += 5;
            this.collBox.y -= 5;
        }
        else if (this.type == "bottomleft") {
            this.collBox.x -= 5;
            this.collBox.y += 5;
        }
        else if (this.type == "bottomright") {
            this.collBox.x += 5;
            this.collBox.y += 5;
        }

    }
    removeCondition() {
        return (this.collBox.x >= 2000 || this.collBox.x <= -100 || this.collBox.y >= 1100 || this.collBox.y <= -100);
    }
}

function getRandomAsteroidURL() {
    let asteroidNumber = getRandomInt(16) + 1;
    return "./static/assets/comets/Picture" + asteroidNumber + ".png";
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max) + 1;
}

function getRandomSign() {
    return Math.random() < 0.5 ? -1 : 1;
}

function signOf(num){
    if (num>0) {
        return 1;
    }
    else {
        return -1;
    }
}

function rotateAsset(ctx, x, y, width, height, angle, image) {
    ctx.save();  // Save context state for later restoration
    ctx.translate(x + width / 2, y + height / 2);  // Translate to center
    ctx.rotate(angle);  // Apply rotation
    ctx.drawImage(image, x, y);
    his.ctx.restore();  // Restore context state`
}

function getCords() {
    fetch('./templates/cosmic_co-pilot.html') // Replace with the path to your HTML file
        .then(response => response.text()) // Converts the response to text
        .then(html => {
            console.log(html);
            
  })
    
}

