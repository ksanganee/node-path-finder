document.documentElement.style.setProperty("--colnum", cols);
document.documentElement.style.setProperty("--rownum", rows);
const cellMargin = 1;
document.documentElement.style.setProperty("--cellMargin", cellMargin + "px");
const w = window.innerWidth;
const h = 0.85 * window.innerHeight;
document.documentElement.style.setProperty(
  "--widthIncrement",
  Math.floor(w / cols) + "px"
);
document.documentElement.style.setProperty(
  "--heightIncrement",
  Math.floor(h / rows) + "px"
);

const openSetCol = "rgb(29, 113, 164)";
const closedSetCol = "rgb(60, 60, 60)";
const pathCol = "purple";
const startCol = "rgb(72, 196, 91)"
const endCol = "red"

var grid;
var start;
var end;
var finished = true;
var nosolution;
var interval;
var openSet = [];
var exploredSet = [];
var drawing;
var erasing;
const states = ["idle", "running", "paused", "finished"];
var pointer = 0;

function updateconstants() {
  allowDiagonals = document.getElementById("diagonalbox").checked;
  renderSets = !document.getElementById("instantpathbox").checked;
  if (renderSets == false) {
    fps = "";
  } else {
    fps = document.getElementById("fpsbox").value;
  }
}

for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    let tempid = j + "-" + i;
    let div = document.createElement("div");
    div.classList.add("gridcell");
    div.id = tempid;
    document.getElementById("container").appendChild(div);
    div.addEventListener("mouseover", () => cellHovered(tempid, i, j));
  }
}

document.addEventListener("keydown", () => {
  if (event.key == "r" && event.metaKey == true) {
    event.preventDefault()
    openSet = [];
    exploredSet = [];
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        grid[i][j].refresh();
        grid[i][j].show("white");
      }
    }
    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.g + start.h;
    pointer = 0;
    start.show(startCol);
    end.show(endCol);
    button.innerHTML = "start";
  }
})

document.addEventListener("keypress", () => {
  if (event.key == "Enter") {
    event.preventDefault()
    buttonClicked();
  } else if (event.key == "r" && event.ctrlKey == true) {
    event.preventDefault()
    openSet = [];
    exploredSet = [];
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        grid[i][j].refresh();
        grid[i][j].show("white");
      }
    }
    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.g + start.h;
    pointer = 0;
    start.show(startCol);
    end.show(endCol);
    button.innerHTML = "start";
  }
});

const container = document.getElementById("container");
container.addEventListener("mousedown", () => {
  if (pointer == 0 || pointer == 3) {
    if (event.button == 0) {
      drawing = true;
      let [i, j] = event.target.id.split("-");
      if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
        grid[i][j].blocked = true;
        document.getElementById(event.target.id).style.backgroundColor =
          "black";
      }
    } else if (event.button == 2) {
      erasing = true;
      let [i, j] = event.target.id.split("-");
      if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
        grid[i][j].blocked = false;
        document.getElementById(event.target.id).style.backgroundColor =
          "white";
      }
    } else {
      drawing = false;
      erasing = false;
    }
  }
});
container.addEventListener("mouseup", () => {
  drawing = false;
  erasing = false;
});
container.addEventListener("contextmenu", () => {
  event.preventDefault();
});

function cellHovered(id, j, i) {
  let div = document.getElementById(id);
  if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
    if (drawing == true) {
      grid[i][j].blocked = true;
      div.style.backgroundColor = "black";
    } else if (erasing == true) {
      grid[i][j].blocked = false;
      div.style.backgroundColor = "white";
    }
  }
}

function removeElement(arr, elem) {
  for (let z = arr.length - 1; z >= 0; z--) {
    if (arr[z] == elem) {
      arr.splice(z, 1);
    }
  }
}

function sliderChanged() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].updateBlocked();
      grid[i][j].show("white");
    }
  }
  start.show(startCol);
  end.show(endCol);
}

function heuristic(a, b) {
  let d;
  if (allowDiagonals == true) {
    d = Math.sqrt(Math.pow(a.i - b.i, 2) + Math.pow(a.j - b.j, 2));
  } else {
    d = Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
  }
  return d;
}

class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.div = document.getElementById(this.i + "-" + this.j);
    this.f = 9999;
    this.g = 9999;
    this.h = undefined;
    this.previous = [];
    this.value = Math.random(1);
    this.blocked = false;
  }
  refresh() {
    this.f = 9999;
    this.g = 9999;
    this.h = undefined;
    this.previous = [];
  }
  show(col) {
    if (this.blocked == true) {
      col = "black";
    }
    this.div.style.backgroundColor = col;
  }
  getNeighbours() {
    var arr = [];
    if (this.i < cols - 1) {
      arr.push(grid[this.i + 1][this.j]);
    }
    if (this.i > 0) {
      arr.push(grid[this.i - 1][this.j]);
    }
    if (this.j < rows - 1) {
      arr.push(grid[this.i][this.j + 1]);
    }
    if (this.j > 0) {
      arr.push(grid[this.i][this.j - 1]);
    }
    if (allowDiagonals == true) {
      if (this.i > 0 && this.j > 0) {
        arr.push(grid[this.i - 1][this.j - 1]);
      }
      if (this.i < cols - 1 && this.j > 0) {
        arr.push(grid[this.i + 1][this.j - 1]);
      }
      if (this.i > 0 && this.j < rows - 1) {
        arr.push(grid[this.i - 1][this.j + 1]);
      }
      if (this.i < cols - 1 && this.j < rows - 1) {
        arr.push(grid[this.i + 1][this.j + 1]);
      }
    }
    for (let y = arr.length - 1; y >= 0; y--) {
      if (arr[y].blocked == true) {
        arr.splice(y, 1);
      }
    }
    return arr;
  }
  updateBlocked() {
    if (this.value < document.getElementById("slider").value / 1000) {
      this.blocked = true;
    } else {
      this.blocked = false;
    }
    if (
      (this.i == 0 && this.j == 0) ||
      (this.i == cols - 1 && this.j == rows - 1)
    ) {
      this.blocked = false;
    }
  }
}

function createGrid() {
  grid = new Array(cols);
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j);
      grid[i][j].updateBlocked()
      grid[i][j].show("white");
    }
  }
  start = grid[0][0];
  end = grid[cols-1][rows-1];
  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.g + start.h;
  start.show(startCol);
  end.show(endCol);
}

function reconstruct_path(cur) {
  cur.show(pathCol);
  if (cur.previous.previous) {
    reconstruct_path(cur.previous);
  }
  start.show(startCol);
  end.show(endCol);
}

function displaySets() {
  if (renderSets == true || pointer == 3) {
    for (let d = 0; d < openSet.length; d++) {
      openSet[d].show(openSetCol);
    }
    for (let e = 0; e < exploredSet.length; e++) {
      exploredSet[e].show(closedSetCol);
    }
  }
  start.show(startCol);
  end.show(endCol);
}

function a_star() {
  displaySets();
  if (openSet.length > 0) {
    current = openSet[0];
    for (var a = 0; a < openSet.length; a++) {
      if (openSet[a].f < current.f) {
        current = openSet[a];
      }
    }
    if (current == end) {
      console.log("COMPLETE");
      document.getElementById("button").innerHTML = "restart";
      pointer = 3;
      clearInterval(interval);
      displaySets();
      reconstruct_path(current);
    } else {
      removeElement(openSet, current);
      exploredSet.push(current);
      let neighbours = current.getNeighbours();
      for (b = 0; b < neighbours.length; b++) {
        var neighbour = neighbours[b];
        tentative_g = current.g + 1;
        if (tentative_g < neighbour.g) {
          neighbour.g = tentative_g;
          neighbour.previous = current;
          neighbour.h = heuristic(neighbour, end);
          neighbour.f = neighbour.g + neighbour.h;
          if (!openSet.includes(neighbour)) {
            openSet.push(neighbour);
          }
        }
      }
    }
  } else {
    console.log("NO SOLUTION");
    document.getElementById("button").innerHTML = "restart";
    pointer = 3;
    clearInterval(interval);
  }
}

function buttonClicked() {
  var button = document.getElementById("button");
  if (states[pointer] == "idle") {
    openSet.push(start);
    pointer = 1;
    button.innerHTML = "pause";
    interval = setInterval(a_star, 1000 / fps);
  } else if (states[pointer] == "running") {
    button.innerHTML = "resume";
    pointer = 2;
    clearInterval(interval);
  } else if (states[pointer] == "paused") {
    button.innerHTML = "pause";
    pointer = 1;
    interval = setInterval(a_star, 1000 / fps);
  } else {
    openSet = [];
    exploredSet = [];
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        grid[i][j].refresh();
        grid[i][j].show("white");
      }
    }
    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.g + start.h;
    pointer = 0;
    start.show(startCol);
    end.show(endCol);
    button.innerHTML = "start";
  }
}

updateconstants();
createGrid();
