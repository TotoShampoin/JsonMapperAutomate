const isGeoJSON = (json) => {
    if(!json) return false;
    if(!json.type) return false;
    if(!json.coordinates) return false;
    return true;
}

const getObjectStructure_aux = (object) => {
    const result = {
        key: '',
        content: [],
    };

    if (Array.isArray(object)) {
        for(let i = 0; i < object.length; i++) {
            let objstruct = getObjectStructure_aux(object[i]);
            if(typeof object[i] === 'object') {
                result.content.push(...objstruct.content);
                result.content.sort((a,b) => a.key.localeCompare(b.key) || b.content.length - a.content.length);
                // remove duplicates non objects
                result.content = result.content.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.key === item.key && t.content.length >= item.content.length
                    ))
                );
            } else {
                result.content = [...result.content, objstruct];
            }
        }
    } else if (typeof object === 'object') {
        if(isGeoJSON(object)) {
            result.content = "geojson (" + object.type + ")";
        } else {
            result.content = Object.keys(object).map(key => {
                const objstruct = getObjectStructure_aux(object[key])
                objstruct.key = key;
                return objstruct;
            });
        }
    } else {
        result.content = typeof object;
    }

    return result;
}
const getObjectStructure = (object) => getObjectStructure_aux(object).content;

const getJSONfields_HTML = (fields, parent = "") => {
    const html = fields.map(field => `
        <div class="jsfield" data-path="${parent}${field.key}">
            ${field.key && `<div class="jsfield__key">${field.key}</div>`}
            <div class="jsfield__content">${
            (typeof field.content === 'object' && field.content !== null)
                ? getJSONfields_HTML(field.content, `${parent}${field.key}.`)
                : field.content
            }</div>
        </div>
    `).join('');
    return html;
}

class JSonManager {
    /** @type {any} */ input;
    /** @type {any} */ output;
    map = [];
    constructor(json) {
        this.input = json;
        this.map = [];
    }
    getInputFields() {
        return getObjectStructure(this.input);
    }
    getInputFields_HTML() {
        const fields = this.getInputFields();
        return getJSONfields_HTML(fields)
    }
    addMap(input_path, output_key) {
        if(this.map.find(map => !output_key.endsWith("[]") && map.output_key === output_key)) return false;
        this.map.push({
            input_path,
            output_key,
        });
        return true;
    }
    removeMap(output_key) {
        this.map = this.map.filter(map => map.output_key !== output_key);
    }
    resetMap() {
        this.map = [];
    }
    getMap_HTML() {
        const html = this.map.map(map => `
            <div class="jsmap" data-path="${map.input_path}" data-key="${map.output_key}">
            <div class="jsmap__output">${map.output_key}</div> ⇐
                <div class="jsmap__input">${map.input_path}</div>
            </div>
        `).join('');
        return html;
    }
    parseMap() {
        if(Array.isArray(this.input)) {
            this.output = this.input.map(element => this.map.reduce((output, map) => {
                const input_path = map.input_path.split('.');
                const output_key = map.output_key.split('.');
                let current = element;
                input_path.forEach(path => {
                    current = current[path];
                });
                if(output_key.length !== 1) {
                    let current_output = output;
                    output_key.forEach((key, index) => {
                        if(key.endsWith('[]')) {
                            let key_bis = key.slice(0, -2);
                            if(index === output_key.length - 1) {
                                current_output[key_bis] = [...(current_output[key_bis] || []), current];
                            } else {
                                current_output = current_output[key_bis] = [...(current_output[key_bis] || [])];
                            }
                        } else {
                            if(index === output_key.length - 1) {
                                current_output[key] = current;
                            } else {
                                current_output = current_output[key] = {...current_output[key]};
                            }
                        }
                    });
                } else {
                    if(output_key[0].endsWith('[]')) {
                        let key_bis = output_key[0].slice(0, -2);
                        output[key_bis] = [...(output[key_bis] || []), current];
                    } else {
                        output[output_key[0]] = current;
                    }
                }
                return output;
            }, {}));
        } else {
            /* {} */
            this.output = this.map.reduce((output, map) => {
                const input_path = map.input_path.split('.');
                const output_key = map.output_key;
                let current = this.input;
                input_path.forEach(path => {
                    current = current[path];
                });
                console.log(output_key);
                if(output_key.endsWith('[]')) {
                    let key_bis = output_key.slice(0, -2);
                    output[key_bis] = [...(output[key_bis] || []), current];
                } else {
                    output[output_key] = current;
                }
                return output;
            }, {});
        }
    }
    export() {
        return JSON.stringify(this.output);
    }
    exportMap() {
        return JSON.stringify(this.map);
    }
    importMap(map_json) {
        this.map = map_json;
    }
}

export default JSonManager;
