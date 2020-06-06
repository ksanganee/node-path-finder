document.documentElement.style.setProperty("--colnum", cols);
document.documentElement.style.setProperty("--rownum", rows);
const cellMargin = 2;
document.documentElement.style.setProperty("--cellMargin", cellMargin + "px");
const w = window.innerWidth;
const h = 0.85*window.innerHeight
document.documentElement.style.setProperty("--widthIncrement", Math.floor(w/cols) + "px");
document.documentElement.style.setProperty("--heightIncrement", Math.floor(h/rows) + "px");

const fps = 300;
const allowDiagonals = true;
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
const states = ["idle", "running", "finished"]
var pointer = 0;

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

const container = document.getElementById("container")
container.addEventListener("mousedown", () => {
  // event.preventDefault();
  if (event.button == 0) {
    drawing = true;
    let [i, j] = event.target.id.split("-");
    if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
      grid[i][j].blocked = true;
      document.getElementById(event.target.id).style.backgroundColor = "black";
    }
  } else if (event.button == 2) {
    erasing = true;
    let [i, j] = event.target.id.split("-");
    if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
      grid[i][j].blocked = false;
      document.getElementById(event.target.id).style.backgroundColor = "white";
    }
  } else {
    drawing = false;
    erasing = false;
  }
});
container.addEventListener("mouseup", () => {
  drawing = false;
  erasing = false;
});
container.addEventListener("contextmenu", () => {
  event.preventDefault();
})

function cellHovered(id, j, i) {
  let div = document.getElementById(id);
  if (!((i == 0 && j == 0) || (i == cols - 1 && j == rows - 1))) {
    if (drawing == true) {
      grid[i][j].blocked = true;
      div.style.backgroundColor = "black";
    } else if (erasing == true) {
      grid[i][j].blocked = false;
      div.style.backgroundColor = "white"
    }
  }
}

function removeElement(arr, elem) {
  for (let z=arr.length-1; z >= 0; z--) {
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
}

function heuristic(a, b) {
  let d;
  if (allowDiagonals == true) {
    d = Math.sqrt(Math.pow(a.i - b.i, 2) + Math.pow(a.j - b.j, 2));
  } else {
    d = Math.abs(a.i-b.i) + Math.abs(a.j-b.j)
  }
  return d;
}

class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.div = document.getElementById(this.i + "-" + this.j)
    this.f = 9999;
    this.g = 9999;
    this.h = undefined;
    this.previous = []
    this.value = Math.random(1);
    this.blocked = false;
  }
  show(col) {
    if (this.blocked == true) {
      col = "black";
    }
    this.div.style.backgroundColor = col;
  }
  getNeighbours() {
    var arr = []
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
    };
    for (let y=arr.length-1; y >= 0; y--) {
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
    if ((this.i == 0 && this.j == 0) || (this.i == cols - 1 && this.j == rows - 1)) {
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
      grid[i][j].show("white")
    }
  }
  start = grid[0][0];
  end = grid[cols-1][rows-1]
  start.g = 0;
  start.h = heuristic(start, end)
  start.f = start.g + start.h
}

function reconstruct_path(cur) {
  cur.show("blue")
  if (cur.previous.previous) {
    reconstruct_path(cur.previous)
  }
}

function displaySets() {
  for (let d=0; d<openSet.length; d++) {
    openSet[d].show("green")
  }
  for (let e=0; e<exploredSet.length; e++) {
    exploredSet[e].show("red")
  }
}

function a_star() {
  mainloop:
  while (openSet.length > 0) {
    current = openSet[0]
    for (var a=0; a<openSet.length; a++) {
      if (openSet[a].f < current.f) {
        current = openSet[a]
      }
    }
    if (current == end) {
      console.log("COMPLETE")
      displaySets();
      reconstruct_path(current);
      break mainloop;
    } else {
      removeElement(openSet, current);
      exploredSet.push(current);
      let neighbours = current.getNeighbours();
      for (b=0; b<neighbours.length; b++) {
        var neighbour = neighbours[b]
        tentative_g = current.g + 1;
        if (tentative_g < neighbour.g) {
          neighbour.g = tentative_g;
          neighbour.previous = current;
          neighbour.h = heuristic(neighbour, end)
          neighbour.f = neighbour.g + neighbour.h
          if (!(openSet.includes(neighbour))) {
            openSet.push(neighbour)
          }
        }
      }
    }
  }
  console.log("NO SOLUTION")
}

createGrid();
openSet.push(start)
// a_star()
