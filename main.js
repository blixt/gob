// Each block is 16x16 pixels with two colors
// Pixels are represented by 8x 32-bit values
// Hit 'E' in the game to open a block editor

// Get the canvas context which we'll use to render everything.
var canvas = document.getElementById('screen');
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;

var º = block(0x282828FF, 0x303030FF, // Ground
              0x0C060000, 0x00000000, 0x01800000, 0x00000000,
              0x00303000, 0x00000000, 0x00060600, 0x00000000);
var ª = block(0x282828FF, 0x303030FF, // Ground, alternate
              0x00000018, 0x00006000, 0x00000000, 0x00300000,
              0x06000000, 0x00000000, 0x0000000C, 0x30000000);
var W = block(0x000000FF, 0x202020FF, // Wall
              0xFFFF0001, 0x00010001, 0xFFFF0100, 0x01000100,
              0xFFFF0001, 0x00010001, 0xFFFF0100, 0x01000100);
var Δ = block(0x00000000, 0x00FFFFFF, // Character
              0x11801240, 0x13C013C0, 0x13C03998, 0x1DB007E0,
              0x03C00180, 0x01800180, 0x03C00660, 0x04200C30);
var Ω = block(0x282828FF, 0xFF0000FF, // Powerup
              0x00000000, 0x1C383E7C, 0x7FFE7FFE, 0x7FFE3FFC,
              0x3FFC1FF8, 0x0FF007E0, 0x03C00180, 0x00000000);
var X = block(0x000000FF, 0x000000FF, // Blackness
              0x00000000, 0x00000000, 0x00000000, 0x00000000,
              0x00000000, 0x00000000, 0x00000000, 0x00000000);

// Player configuration.
var player = {life: 3, x: 1, y: 1};

// Input state.
var input = {direction: 0};

// Center coordinates and size of the viewport.
var view = {
  x: player.x, y: player.y,
  width: canvas.width >> 4,
  height: canvas.height >> 4
};

// World configuration. Should be pretty self-explanatory.
var world = {
  width: 20,
  blocks: [
    W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W,
    W, º, º, º, º, º, W, ª, º, º, º, º, º, º, º, º, º, º, º, W,
    W, º, ª, º, º, º, W, º, º, º, ª, º, º, º, º, ª, º, º, º, W,
    W, º, º, Ω, º, º, W, º, ª, º, º, º, º, º, º, º, º, ª, º, W,
    W, º, º, º, ª, º, W, º, º, º, º, º, º, º, º, º, º, º, º, W,
    W, º, º, º, º, º, W, º, º, º, º, ª, º, º, ª, º, º, º, º, W,
    W, W, W, º, W, W, W, º, º, ª, º, º, º, º, º, º, º, º, º, W,
    W, º, º, º, ª, º, º, º, º, ª, º, º, º, º, º, º, º, º, º, W,
    W, ª, W, W, W, W, W, º, º, º, º, º, º, º, º, ª, º, º, º, W,
    W, º, W, º, º, º, W, º, º, º, º, º, ª, º, º, º, º, º, º, W,
    W, º, W, º, Ω, º, W, º, º, º, º, º, º, º, º, º, º, º, º, W,
    W, º, W, ª, º, º, W, º, º, º, ª, º, ª, º, º, º, º, º, ª, W,
    W, º, W, W, º, W, W, º, º, º, º, º, º, º, ª, º, º, º, º, W,
    W, º, ª, º, º, º, º, º, º, º, º, º, º, º, º, º, ª, º, º, W,
    W, º, W, W, º, W, W, º, ª, º, º, º, º, º, º, º, º, º, º, W,
    W, ª, W, º, º, º, W, º, º, º, º, º, º, ª, º, º, º, º, º, W,
    W, º, W, º, Ω, ª, W, º, º, º, º, º, º, º, º, º, º, º, º, W,
    W, º, W, ª, º, º, W, º, º, ª, º, º, ª, º, º, º, ª, º, º, W,
    W, ª, W, W, W, W, W, º, º, º, º, º, º, º, º, º, º, º, º, W,
    W, º, º, º, º, ª, º, º, º, º, ª, º, º, º, º, º, º, º, ª, W,
    W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W,
  ],
  accumulatedTime: 0,
  previousFrameTime: +new Date
};

// What happens when the player attempts to walk onto a block. Use the
// block's hash value to add it to the lookup table.
//
// Supported return values:
// - false to prevent the action
// - true to do nothing
// - a block to replace the current block
var hit = {};

// Don't let the player walk through walls or the end of the world.
hit[W.hash] = function (x, y) { return false; };
hit[X.hash] = function (x, y) { return false; };
// Let the user pick up powerups.
hit[Ω.hash] = function (x, y) {
  player.life++;
  return º;
};

// Begin the main loop.
main();

function move(dx, dy) {
  var nx = player.x + dx, ny = player.y + dy;
  var index = getIndex(nx, ny);
  var hash = getBlock(index, nx, ny).hash;
  var result = hit.hasOwnProperty(hash) ? hit[hash](nx, ny) : true;
  if (result !== false) {
    view.x = player.x = nx;
    view.y = player.y = ny;
    if (result !== true) {
      // Replace the block at the destination.
      world.blocks[index] = result;
    }
  }
}

function render() {
  var vx = view.x - (view.width >> 1), vy = view.y - (view.height >> 1);
  var index = getIndex(vx, vy);
  for (var y = 0; y < view.height; y++) {
    for (var x = 0; x < view.width; x++) {
      var block = getBlock(index++, vx + x, vy + y);
      context.drawImage(block.canvas, x << 4, y << 4);
      if (vx + x == player.x && vy + y == player.y) {
        // Special case: render character block at player's location.
        context.drawImage(Δ.canvas, x << 4, y << 4);
      }
    }
    index += world.width - view.width;
  }
}

function tick() {
  switch (input.direction) {
    case 1: // Left
      move(-1, 0);
      break;
    case 2: // Up
      move(0, -1);
      break;
    case 3: // Right
      move(1, 0);
      break;
    case 4: // Down
      move(0, 1);
      break;
  }
}

function main(time) {
  if (time) {
    world.accumulatedTime += time - world.previousFrameTime;
    world.previousFrameTime = time;
  }

  // Tick the game world every ~128 ms.
  var ticks = world.accumulatedTime >> 7;
  world.accumulatedTime -= ticks << 7;
  if (ticks > 5) {
    // If we're 5 or more game ticks behind, bail on all but one.
    console.warn('Bailing on %d game ticks', ticks - 1);
    ticks = 1;
  }

  for (var i = 0; i < ticks; i++) {
    tick();
  }

  render();
  requestAnimationFrame(main);
}

function getIndex(x, y) {
  return y * world.width + x;
}

function getBlock(index, x, y) {
  if (y < 0 || x < 0 || x >= world.width) {
    // Handle logical out of bounds that may still be within the world data.
    return X;
  } else {
    return index < world.blocks.length ? world.blocks[index] : X;
  }
}

function block(var_args) {
  if (arguments.length != 10) {
    throw new Error('block must be called with 10 values');
  }
  // Create a canvas for this tile.
  var canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  var context = canvas.getContext('2d');
  // Draw the tile.
  var imageData = context.createImageData(16, 16);
  var index = 2, bit = 31;
  for (var offset = 0; offset < imageData.data.length; offset += 4) {
    var rgba = arguments[(arguments[index] & (1 << bit)) ? 1 : 0];
    imageData.data[offset + 0] = rgba >>> 24;
    imageData.data[offset + 1] = rgba >>> 16 & 0xFF;
    imageData.data[offset + 2] = rgba >>> 8 & 0xFF;
    imageData.data[offset + 3] = rgba & 0xFF;
    if (--bit == -1) {
      bit = 31;
      index++;
    }
  }
  context.putImageData(imageData, 0, 0);
  // Create a unique hash for this block.
  var hash;
  for (var i = 0; i < arguments.length; i++) {
    hash = fnv(arguments[i], hash);
  }
  return {hash: hash.toString(16), canvas: canvas};
}

function fnv(number, opt_hash) {
  // Unsigned 32-bit integers only.
  number = number >>> 0;
  var hash = typeof opt_hash == 'undefined' ? 0x811C9DC5 : opt_hash;
  while (number > 0) {
    var octet = number & 0xFF;
    hash = (hash ^ octet) * 0x01000193 >>> 0;
    number = number >> 8;
  }
  return hash;
}

addEventListener('keydown', function (event) {
  switch (event.keyCode) {
    case 37:
    case 38:
    case 39:
    case 40:
      input.direction = event.keyCode - 36;
      event.preventDefault();
      break;
    case 69:
      editor();
      break;
  }
});

addEventListener('keyup', function (event) {
  if (event.keyCode - 36 == input.direction) {
    input.direction = 0;
  }
});

function editor() {
  // The most ghetto editor in the world.
  // TODO: This UI needs some serious pimpin'.
  if (document.querySelector('.editor')) return;
  var div = document.createElement('div');
  div.addEventListener('mouseover', function (event) {
    if (event.target.name == 'bit' && (event.shiftKey || event.altKey)) {
      event.target.checked = event.shiftKey;
    }
  });
  div.className = 'editor';
  var index = 0, bit = 31;
  for (var y = 0; y < 16; y++) {
    for (var x = 0; x < 16; x++) {
      var box = document.createElement('input');
      box.name = 'bit';
      box.type = 'checkbox';
      box.value = [index, bit].join(':');
      div.appendChild(box);
      if (--bit == -1) {
        bit = 31;
        index++;
      }
    }
    div.appendChild(document.createElement('br'));
  }
  var info = document.createElement('p');
  info.style.color = '#fff';
  info.style.fontSize = '11px';
  info.textContent = 'Hold down Shift and hover boxes to select them, Alt to unselect';
  div.appendChild(info);
  var button = document.createElement('button');
  button.textContent = 'Output block to console log';
  button.addEventListener('click', function () {
    var boxes = document.querySelectorAll('input:checked[name=bit]');
    var values = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < boxes.length; i++) {
      var pieces = boxes[i].value.split(':');
      var index = parseInt(pieces[0]), bit = parseInt(pieces[1]);
      values[index] = (values[index] | (1 << bit)) >>> 0;
    }
    var mapper = function (value) {
      var str = value.toString(16).toUpperCase();
      return '0x' + '00000000'.slice(str.length) + str;
    };
    var set1 = values.slice(0, 4).map(mapper).join(', ');
    var set2 = values.slice(4, 8).map(mapper).join(', ');
    console.log('var _ = block(0x000000FF, 0xFFFFFFFF, // Description\n' +
                '              ' + set1 + ',\n' +
                '              ' + set2 + ');');
  });
  div.appendChild(button);
  document.body.appendChild(div);
}
