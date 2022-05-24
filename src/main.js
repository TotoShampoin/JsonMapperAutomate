import process from 'node:process';
import fs from 'fs/promises';
import JSonManager from './json-manager.js';

let [input, map, output] = process.argv.slice(2);
if(!input || !map) {
    console.error('Usage: npm start <input-file> <map-file> [output-file]');
    process.exit(1);
}
if(!output) {
    output = input.replace(/\.json$/, '-export.json');
}

const json_file = await fs.readFile(input, 'utf8');
const map_file = await fs.readFile(map, 'utf8');

const jsm = new JSonManager(JSON.parse(json_file));
jsm.importMap(JSON.parse(map_file));
jsm.parseMap();

fs.writeFile(output, jsm.export());

