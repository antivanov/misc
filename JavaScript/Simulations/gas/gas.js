(function(host) {

  function integerRandom(value) {
    return Math.floor(Math.random() * value);
  }

  function signedIntegerRandom(value) {
    return (Math.random() < 0.5 ? -1 : 1) * integerRandom(value);
  }

  /*
   * Ideal gas. The mass of a single molecule is so small compared to its speed that we can
   * assume that the force of gravity is zero and the forces of gravity in between molecules are negligible.
   */
  function IdealGasPhysicalWorld() {
    this.visibleFeatureNames = ['molecules', 'randomPath', 'averagePressure', 'averageSpeed'];
  }

  IdealGasPhysicalWorld.prototype = new PhysicalWorld();

  IdealGasPhysicalWorld.prototype.init = function() {

    //Number of molecules in the box
    this.numberOfMolecules = 300;

    //Average speed of a molecule, real speed is in the interval [0, 2 * this.averageSpeed]
    this.averageDimensionSpeed = 50;

    this.box = {
      x: 600,
      y: 600
    };

    this.moleculeRadius = 5;

    //Time is discrete in our physical world, this is the increment between two adjacent time values
    this.deltaT = 0.05;

    //What part of impulse of every molecule is still remaining when it hits the border of the box
    this.borderHitImpulseRetained = 1;

    //Molecules, each molecule has coordinates
    this.molecules = this.createMolecules();

    //Pressure, is computed from other physical characteristics
    this.averagePressure = 0;

    //Average speed of the moving molecules, "temperature"
    this.averageSpeed = 0;

    //Number of times some molecule has hit the border in latest deltaT
    this.borderHits = 0;

    //Current clock tick
    this.currentClockTick = 0;

    //Time delta during which pressure is being measured this.measurementClockTicks * this.deltaT
    this.measurementClockTicks = 10;

    //Random path of a selected molecule
    this.randomPath = [];

    //Maximum length of random path that is kept in memory
    this.randomPathMaxLength = 100;
  };

  IdealGasPhysicalWorld.prototype.createMolecules = function() {
    var molecules = [];

    for (var i = 0; i < this.numberOfMolecules; i++) {
      molecules.push({
        x: integerRandom(this.box.x),
        y: integerRandom(this.box.y),
        V: {
          x: signedIntegerRandom(this.averageDimensionSpeed),
          y: signedIntegerRandom(this.averageDimensionSpeed)
        },
        r: this.moleculeRadius
      });
    }
    return molecules;
  };

  IdealGasPhysicalWorld.prototype.rememberRandomPathEntry = function(pathEntry) {
    this.randomPath.push(pathEntry);
    if (this.randomPath.length >= this.randomPathMaxLength) {
      this.randomPath.shift();
    }
  };

  IdealGasPhysicalWorld.prototype.moveMolecules = function() {
    var self = this;

    this.molecules.forEach(function(molecule) {
      molecule.x = molecule.x + molecule.V.x * self.deltaT;
      molecule.y = molecule.y + molecule.V.y * self.deltaT;
    });
  };

  IdealGasPhysicalWorld.prototype.collideWithBorder = function(molecule, dim) {
    molecule.V[dim] = this.borderHitImpulseRetained * -molecule.V[dim];

    //Adding rigidity
    if (molecule[dim] > this.box[dim]) {
      molecule[dim] = molecule[dim] - molecule.r / 8;
    } else if (molecule[dim] < 0) {
      molecule[dim] = molecule[dim] + molecule.r / 8;
    }
  };

  IdealGasPhysicalWorld.prototype.hasBorderCollision = function(molecule, dim) {
    return (molecule[dim] > this.box[dim]) || (molecule[dim] < 0);
  };

  IdealGasPhysicalWorld.prototype.handleCollisionWithBorder = function() {
    var self = this;

    this.molecules.forEach(function(molecule, idx) {
      ['x', 'y'].forEach(function(dim) {
        if (self.hasBorderCollision(molecule, dim)) {
          if (idx === 0) {
            self.rememberRandomPathEntry({
              x: molecule.x,
              y: molecule.y
            });
          }
          self.borderHits++;
          self.collideWithBorder(molecule, dim);
        }
      });
    });
  };

  IdealGasPhysicalWorld.prototype.collide = function(molecule1, molecule2) {

    //Collision, impulse and energy are preserved, masses of molecules are same
    var molecule1V = molecule1.V;

    molecule1.V = molecule2.V;
    molecule2.V = molecule1V;

    /*
     * Interesting artefact observed in  the simulation.
     * Some molecules statistically will get close speeds and
     * become "glued" together for some time.
     * In reality it probably means that molecules can get a chance to form a new
     * molecule if chemical reaction is possible between them.
     *
     * Just making the collision here a bit more rigid, i.e. no chemical reaction 
     * is possible.
     */
    molecule1.x = molecule1.x - (molecule2.x - molecule1.x) / 16;
    molecule1.y = molecule1.y - (molecule2.y - molecule1.y) / 16;
    molecule2.x = molecule2.x - (molecule1.x - molecule2.x) / 16;
    molecule2.y = molecule2.y - (molecule1.y - molecule2.y) / 16;
  };

  IdealGasPhysicalWorld.prototype.haveCollision = function(molecule1, molecule2) {
    var distance = Math.sqrt(Math.pow(molecule1.x - molecule2.x, 2) + Math.pow(molecule1.y - molecule2.y, 2));

    return distance <= molecule1.r + molecule2.r;
  };

  IdealGasPhysicalWorld.prototype.handleCollisionBetweenMolecules = function() {
    var self = this;

    this.molecules.forEach(function(molecule1, idx1) {
      self.molecules.slice(idx1 + 1).forEach(function(molecule2, idx2) {
        if (self.haveCollision(molecule1, molecule2)) {
          if (idx1 === 0) {
            self.rememberRandomPathEntry({
              x: molecule1.x,
              y: molecule1.y
            });
          }
          self.collide(molecule1, molecule2);
        }
      });
    });
  };

  IdealGasPhysicalWorld.prototype.measureAveragePressure = function() {
    var self = this;

    /*
     * Should divide by the dimensions of the box, just a question of scaling as the box does
     * not change its dimensions.
     */
    this.averagePressure = this.borderHits / this.measurementClockTicks;
    this.borderHits = 0;
    this.averageSpeed = this.molecules.reduce(function(prev, molecule) {
      var V = Math.sqrt(Math.pow(molecule.V.x, 2) + Math.pow(molecule.V.y, 2));

      return prev + V / self.molecules.length;
    }, 0);
  };

  /*
   * Some physical characteristics such as pressure change quite a bit due to the small number of molecules,
   * then we need to average them out over some time period to get statistically significant results.
   */
  IdealGasPhysicalWorld.prototype.measureAverages = function() {
    this.currentClockTick++;
    if (this.currentClockTick >= this.measurementClockTicks) {
      this.currentClockTick = 0;
      this.measureAveragePressure();
    }
  };

  IdealGasPhysicalWorld.prototype.update = function() {
    this.measureAverages();
    this.moveMolecules();
    this.handleCollisionWithBorder();
    this.handleCollisionBetweenMolecules();
  };

  /*
   * Display.
   */
  function IdealGasDisplay(displayElementSelector, canvasWidth, canvasHeight) {
    Display.call(this, displayElementSelector, canvasWidth, canvasHeight);
  }

  IdealGasDisplay.prototype = new host.Display();

  IdealGasDisplay.prototype.draw = function(world) {
    var self = this;
    var features = world.getVisibleFeatures();
    var molecules = features.molecules;
    var randomPath = features.randomPath.slice();

    randomPath.push({
      x: molecules[0].x,
      y: molecules[0].y
    });

    this.clear();
    molecules.forEach(function(molecule, idx) {
      self.drawMolecule(molecule, idx);
    });

    //Drawing random molecule path
    if (randomPath.length > 1) {
      self.drawingContext.moveTo(randomPath[0].x, randomPath[0].y);
      randomPath.slice(1).forEach(function(pathEntry) {
        self.drawingContext.lineTo(pathEntry.x, pathEntry.y);
        self.drawingContext.stroke();
        self.drawingContext.moveTo(pathEntry.x, pathEntry.y);
      });
    }

    //Drawing measured average values
    this.drawingContext.fillStyle = "red";
    this.drawingContext.fillText("Pressure: " + features.averagePressure.toFixed(2), 20, 20);
    this.drawingContext.fillText("Temperature: " + features.averageSpeed.toFixed(2), 20, 60);
  };

  IdealGasDisplay.prototype.drawMolecule = function(molecule, idx) {
    this.drawingContext.fillStyle = ["black", "white", "gray"][idx % 3];
    this.drawingContext.beginPath();
    this.drawingContext.arc(molecule.x, molecule.y, molecule.r, 0, 2 * Math.PI, false);
    this.drawingContext.fill();
    this.drawingContext.stroke();
  };

  Main.experiment(function() {
    return {
      display: new IdealGasDisplay("#display", 600, 600),
      physicalWorld: new IdealGasPhysicalWorld(),
      initialParameters: {
      }
    };
  });
})(this);