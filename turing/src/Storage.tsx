import { autorun, observable } from "mobx";

export interface State {
    name: string;
    description: string;
}

export interface Symbol {
    name: string;
    description: string;
}

export interface Tape {
    tape: number[];
    pos: number;
}

export interface Rule {
    symbols: number[];
    state: number;
    new_symbols: number[];
    new_state: number;
    move: string;
}

export interface Program {
    name: string,
    tapes: {tapes: Tape[], state: number},
    rules: Rule[],
    states: State[],
    symbols: Symbol[]
}

export interface Session {
    name: string,
    machine: {tapes: Tape[], state: number}[],
    rules: Rule[],
    states: State[],
    symbols: Symbol[],
    history_pos: number,
    run_mode: boolean
}

const lodashClonedeep = require('lodash/cloneDeep');

export class LocalState {
    @observable machine: {tapes: Tape[], state: number}[];
    @observable rules: Rule[];
    @observable states: State[];
    @observable symbols: Symbol[];
    @observable table: Array<Array<Rule | null>[] | null>;
    @observable history_pos: number;
    @observable run_mode: boolean;
    @observable programs: Array< Program | Session >;
    @observable possible_name: string;

    handlePossible_name = (e: any) => {
        this.possible_name = e.target.value;
    }

    removeprogram = (i: number) => {
        this.programs.splice(i, 1);
    }

    machineFromstart = () => {
        if (this.possible_name !== 'Input name here') {
            this.programs.push({
                name: lodashClonedeep(this.possible_name),
                tapes: lodashClonedeep(this.machine[0]),
                rules: lodashClonedeep(this.rules),
                states: lodashClonedeep(this.states),
                symbols: lodashClonedeep(this.symbols)
            });
            this.possible_name = 'Input name here';
        }
    }

    machineFromactual = () => {
        if (this.possible_name !== 'Input name here') {
            this.programs.push({
                name: lodashClonedeep(this.possible_name),
                tapes: lodashClonedeep(this.machine[this.history_pos]),
                rules: lodashClonedeep(this.rules),
                states: lodashClonedeep(this.states),
                symbols: lodashClonedeep(this.symbols)
            });
            this.possible_name = 'Input name here';
        }
    }

    sessionFromstate = () => {
        if (this.possible_name !== 'Input name here') {
            this.programs.push({
                name: lodashClonedeep(this.possible_name),
                machine: lodashClonedeep(this.machine),
                rules: lodashClonedeep(this.rules),
                states: lodashClonedeep(this.states),
                symbols: lodashClonedeep(this.symbols),
                history_pos: lodashClonedeep(this.history_pos),
                run_mode: lodashClonedeep(this.run_mode)
            });
            this.possible_name = 'Input name here';
        }
    }

    cleaninput = () => {
        if (this.possible_name === 'Input name here') {
            this.possible_name = '';
        }
    }

    blurinput = () => {
        if (this.possible_name === '') {
            this.possible_name = 'Input name here';
        }
    }

    handleLoadmachine = (i: number) => {
        const mach = lodashClonedeep(this.programs[i]);
        while (this.machine.length > 0) {
            this.machine.pop();
        }
        while (this.rules.length > 0) {
            this.rules.pop();
        }
        while (this.states.length > 0) {
            this.states.pop();
        }
        while (this.symbols.length > 0) {
            this.symbols.pop();
        }
        mach.rules.forEach((rule: Rule) => this.rules.push(rule));
        mach.states.forEach((st: State) => this.states.push(st));
        mach.symbols.forEach((sym: Symbol) => this.symbols.push(sym));
        if ( 'run_mode' in mach) {
            mach.machine.forEach((tapes: {tapes: Tape[], state: number}) => this.machine.push(tapes));
            this.history_pos = mach.history_pos;
            this.run_mode = mach.run_mode;
        } else {
            this.machine.push(mach.tapes);
            this.history_pos = 0;
            this.run_mode = true;
        }
    }

    sync = () => {
        this.table[0] = this.symbols.map((sym: Symbol, symbol_ind: number) => {
            return this.states.map((st: State, state_ind: number) => {
                let r = this.rules.filter(rule => rule.symbols[0] === symbol_ind &&
                    rule.state === state_ind);
                return r.length ? r[0] : null;
            });
        })
    }

    handleInputmode = () => {
        this.run_mode = false;
    }

    handleTestmode = () => {
        this.run_mode = true;
    }

    handleTapehistory = (i: number) => {
       // this.machine[this.history_pos] = lodashClonedeep(this.history_tapes[i]);
        this.history_pos = i;
    }

    handleTapeback = () => {
        if(this.history_pos > 0) {
            //this.machine[this.history_pos] = lodashClonedeep(this.history_tapes.pop());
            this.history_pos--;
        }
    }

    handleFramechange = (e: any, i: number, i2: number) => {
        const pos = this.symbols.findIndex(st => st.name === e.target.value);
        const old = this.machine[this.history_pos].tapes[i2].tape[i];
        if (pos === -1) {
            this.symbols.push({name: e.target.value, description: ''});
            this.machine[this.history_pos].tapes[i2].tape[i] = this.symbols.length - 1;
        } else {
            this.machine[this.history_pos].tapes[i2].tape[i] = pos;
        }
        if (this.symbols[old].description === '' && this.rules.filter((rule: Rule) => rule.symbols[0] === old).length +
            this.rules.filter((rule: Rule) => rule.new_symbols[0] === old).length +
            this.machine[this.history_pos].tapes[0].tape.filter((frame: number) => frame === old).length === 0) {
                this.rules = this.rules.map((rule) => {
                    if (rule.symbols[0] > i) {
                        rule.symbols[0]--;
                    }
                    if (rule.new_symbols[0] > i) {
                        rule.new_symbols[0]--;
                    }
                    return rule;
                });
                this.symbols.splice(old, 1);
        }
    }

    handleRemoverule = (i: number) => {
        this.rules.splice(i, 1);
    }

    handleRemovesymbol = (i: number) => {
        this.rules = this.rules.map((rule) => {
            if (rule.symbols[0] > i) {
                rule.symbols[0]--;
            }
            if (rule.new_symbols[0] > i) {
                rule.new_symbols[0]--;
            }
            return rule;
        });
        this.symbols.splice(i, 1);
    }

    handleRemovestate = (i: number) => {
        this.rules = this.rules.map((rule) => {
            if (rule.state > i) {
                rule.state--;
            }
            if (rule.new_state > i) {
                rule.new_state--;
            }
            return rule;
        });
        this.states.splice(i, 1);
    }

    rulesEffect = () => {
        return autorun(
            () => this.sync()
        )
    }

    handleSymbolNamechange = (e: any, ind: number) => {
        this.symbols[ind].name = e.target.value;
    }

    handleSymbolDescchange = (e: any, ind: number) => {
        this.symbols[ind].description = e.target.value;
    }

    handleStateNamechange = (e: any, ind: number) => {
        this.states[ind].name = e.target.value;
    }

    handleStateDescchange = (e: any, ind: number) => {
        this.states[ind].description = e.target.value;
    }

    handlestep = () => {
        let rule = this.rules.find(rl => rl.state === this.machine[this.history_pos].state && rl.symbols[0] ===
            this.machine[this.history_pos].tapes[0].tape[this.machine[this.history_pos].tapes[0].pos])
        if (rule !== undefined) {
            this.machine = this.machine.slice(0, this.history_pos + 1);
            this.machine.push(lodashClonedeep(this.machine[this.history_pos]));
            this.history_pos++;
            this.machine[this.history_pos].tapes[0].tape[this.machine[this.history_pos].tapes[0].pos] = rule.new_symbols[0];
            this.machine[this.history_pos].state = rule.new_state;
            if (rule.move === 'L') {
                this.machine[this.history_pos].tapes[0].pos--;
            } else if (rule.move === 'R') {
                this.machine[this.history_pos].tapes[0].pos++;
            }
            this.align();
        }
    }

    handleAddrule = () => {
        this.rules.push({symbols: [0], state: 0, new_state: 0, new_symbols: [0], move: 'N' });
    }

    align = () => {
        let r = 0;
        this.machine[this.history_pos].tapes = this.machine[this.history_pos].tapes.map( (bobbin: Tape) => {
            if(bobbin.tape[0] === 0 && bobbin.tape[1] === 0 && bobbin.tape[2] === 0) {
                bobbin.tape.shift();
                bobbin.pos--;
                r = 1;
            } else if(bobbin.tape[0] !== 0 || bobbin.tape[1] !== 0) {
                bobbin.tape.unshift(0);
                bobbin.pos++;
                r = 1;
            }
            return bobbin;
        })
        this.machine[this.history_pos].tapes = this.machine[this.history_pos].tapes.map( (bobbin: Tape) => {
            if(bobbin.tape[bobbin.tape.length - 3] === 0 && bobbin.tape[bobbin.tape.length - 2] === 0 &&
                bobbin.tape[bobbin.tape.length - 1] === 0) {
                bobbin.tape.pop();
                r = 1;
            } else if(bobbin.tape[bobbin.tape.length - 2] !== 0 || bobbin.tape[bobbin.tape.length - 1] !== 0) {
                bobbin.tape.push(0);
                r = 1;
            }
            return bobbin;
        })
        return r;
    }

    handleRuleStatechange = (e: any, ind: number) => {
        const val = e.target.value;
        if (this.rules.filter(rule => rule.state === this.rules[ind].state).length +
            this.rules.filter(rule => rule.new_state === this.rules[ind].state).length > 1) {
            if (this.states.filter(st => st.name === val).length === 0) {
                this.states.push({name: val, description: ''});
                this.rules[ind].state = this.states.length - 1;
            } else {
                this.rules[ind].state = this.states.findIndex(st => st.name === val);
            }
        } else {
            if (this.states.filter(st => st.name === val).length === 0) {
                this.states[this.rules[ind].state].name = val;
            } else {
                const pos = this.states.findIndex(st => st.name ===
                    this.states[this.rules[ind].state].name);
                this.rules[ind].state = this.states.findIndex(st => st.name === val);
                if(this.states[pos].description === '') {
                    this.states.splice(pos, 1);
                    this.rules = this.rules.map(rule => {
                        if(rule.state > pos) {
                            rule.state--;
                        }
                        if(rule.new_state > pos) {
                            rule.new_state--;
                        }
                        return rule;
                    })
                }
            }
        }
    }

    handleRuleNew_Statechange = (e: any, ind: number) => {
        const val = e.target.value;
        if (this.rules.filter(rule => rule.state === this.rules[ind].new_state).length +
            this.rules.filter(rule => rule.new_state === this.rules[ind].new_state).length > 1) {
            if (this.states.filter(st => st.name === val).length === 0) {
                this.states.push({name: val, description: ''});
                this.rules[ind].new_state = this.states.length - 1;
            } else {
                this.rules[ind].new_state = this.states.findIndex(st => st.name === val);
            }
        } else {
            if (this.states.filter(st => st.name === val).length === 0) {
                this.states[this.rules[ind].new_state].name = val;
            } else {
                const pos = this.states.findIndex(st => st.name ===
                    this.states[this.rules[ind].new_state].name);
                this.rules[ind].new_state = this.states.findIndex(st => st.name === val);
                if(this.states[pos].description === '') {
                    this.states.splice(pos, 1);
                    this.rules = this.rules.map(rule => {
                        if(rule.state > pos) {
                            rule.state--;
                        }
                        if(rule.new_state > pos) {
                            rule.new_state--;
                        }
                        return rule;
                    })
                }
            }
        }
    }

    handleRuleMovechange = (e: any, ind: number) => {
        e.target.select();
        let val = e.target.value;
        val = val[0] === 'l' ? 'L' : val;
        val = val[0] === 'n' ? 'N' : val;
        val = val[0] === 'r' ? 'R' : val;
        if(['L', 'N', 'R'].includes(val)) {
            this.rules[ind].move = val;
        }
        //e.target.select();
    }

    handleRuleSymbolchange = (e: any, ind: number) => {
        const val = e.target.value;
        if (this.rules.filter(rule => rule.symbols[0] === this.rules[ind].symbols[0]).length +
            this.rules.filter(rule => rule.new_symbols[0] === this.rules[ind].symbols[0]).length +
            this.machine[this.history_pos].tapes[0].tape.filter(frame => frame === this.rules[ind].symbols[0]).length > 1) {
            if (this.symbols.filter(st => st.name === val).length === 0) {
                this.symbols.push({name: val, description: ''});
                this.rules[ind].symbols[0] = this.symbols.length - 1;
            } else {
                this.rules[ind].symbols[0] = this.symbols.findIndex(st => st.name === val);
            }
        } else {
            if (this.symbols.filter(st => st.name === val).length === 0) {
                this.symbols[this.rules[ind].symbols[0]].name = val;
            } else {
                const pos = this.rules[ind].symbols[0];
                this.rules[ind].symbols[0] = this.symbols.findIndex(st => st.name === val);
                if(this.symbols[pos].description === '') {
                    this.symbols.splice(pos,1);
                    this.rules = this.rules.map(rule => {
                        if(rule.symbols[0] > pos) {
                            rule.symbols[0]--;
                        }
                        if(rule.new_symbols[0] > pos) {
                            rule.new_symbols[0]--;
                        }
                        return rule;
                    })
                }
            }
        }
    }

    handleRuleNew_Symbolchange = (e: any, ind: number) => {
        const val = e.target.value;
        if (this.rules.filter(rule => rule.symbols[0] === this.rules[ind].new_symbols[0]).length +
            this.rules.filter(rule => rule.new_symbols[0] === this.rules[ind].new_symbols[0]).length +
            this.machine[this.history_pos].tapes[0].tape.filter(frame => frame === this.rules[ind].symbols[0]).length > 1) {
            if (this.symbols.filter(st => st.name === val).length === 0) {
                this.symbols.push({name: val, description: ''});
                this.rules[ind].new_symbols[0] = this.symbols.length - 1;
            } else {
                this.rules[ind].new_symbols[0] = this.symbols.findIndex(st => st.name === val);
            }
        } else {
            if (this.symbols.filter(st => st.name === val).length === 0) {
                this.symbols[this.rules[ind].new_symbols[0]].name = val;
            } else {
                const pos = this.rules[ind].new_symbols[0];
                this.rules[ind].new_symbols[0] = this.symbols.findIndex(st => st.name === val);
                if(this.symbols[pos].description === '') {
                    this.symbols.splice(pos,1);
                    this.rules = this.rules.map(rule => {
                        if(rule.symbols[0] > pos) {
                            rule.symbols[0]--;
                        }
                        if(rule.new_symbols[0] > pos) {
                            rule.new_symbols[0]--;
                        }
                        return rule;
                    })
                }
            }
        }
    }

    constructor() {
        this.machine = [{tapes: [{tape: [0, 0, 0, 0, 0], pos: 2}], state: 0}];
        this.states = [
            {name: 'State 0', description: 'Description of example state 0'},
            {name: 'State 1', description: 'Description of example state 1'},
            {name: 'State 2', description: 'Description of example state 2'},
        ];
        this.symbols = [
            {name: '', description: 'Description of example symbol 0'},
            {name: '1', description: 'Description of example symbol 1'}
        ];
        this.rules = [{symbols: [0], state: 0, new_state: 1, new_symbols: [1], move: 'R' },
            {symbols: [0], state: 1, new_state: 2, new_symbols: [1], move: 'R' }, ];
        this.table = [null];
        this.sync();
        this.history_pos = 0;
        this.run_mode = false;
        this.programs = [];
        this.possible_name = 'Default sample';
        this.machineFromstart();
        this.possible_name = 'Input name here';
        this.programs.push({name: 'Multiply (unary numeral system)',
            tapes: {tapes: [{tape: [0, 0, 5, 1, 1, 1, 2, 1, 1, 3, 5, 0, 0], pos: 2}], state: 0}
        , rules: [
                {state: 0, symbols: [1], new_state: 0, new_symbols: [1], move: 'R'},
                {state: 1, symbols: [1], new_state: 2, new_symbols: [4], move: 'R'},
                {state: 2, symbols: [1], new_state: 2, new_symbols: [1], move: 'L'},
                {state: 3, symbols: [1], new_state: 4, new_symbols: [4], move: 'R'},
                {state: 4, symbols: [1], new_state: 4, new_symbols: [1], move: 'R'},
                {state: 7, symbols: [1], new_state: 2, new_symbols: [4], move: 'R'},

                {state: 0, symbols: [2], new_state: 1, new_symbols: [2], move: 'R'},
                {state: 2, symbols: [2], new_state: 3, new_symbols: [2], move: 'L'},
                {state: 4, symbols: [2], new_state: 4, new_symbols: [2], move: 'R'},
                {state: 6, symbols: [2], new_state: 7, new_symbols: [2], move: 'R'},
                {state: 8, symbols: [2], new_state: 9, new_symbols: [2], move: 'N'},

                {state: 2, symbols: [3], new_state: 2, new_symbols: [3], move: 'L'},
                {state: 4, symbols: [3], new_state: 4, new_symbols: [3], move: 'R'},
                {state: 7, symbols: [3], new_state: 8, new_symbols: [3], move: 'L'},

                {state: 2, symbols: [4], new_state: 2, new_symbols: [4], move: 'L'},
                {state: 3, symbols: [4], new_state: 3, new_symbols: [4], move: 'L'},
                {state: 4, symbols: [4], new_state: 4, new_symbols: [4], move: 'R'},
                {state: 6, symbols: [4], new_state: 6, new_symbols: [1], move: 'R'},
                {state: 7, symbols: [4], new_state: 7, new_symbols: [4], move: 'R'},
                {state: 8, symbols: [4], new_state: 8, new_symbols: [1], move: 'L'},

                {state: 0, symbols: [5], new_state: 0, new_symbols: [5], move: 'R'},
                {state: 3, symbols: [5], new_state: 6, new_symbols: [5], move: 'R'},
                {state: 4, symbols: [5], new_state: 5, new_symbols: [1], move: 'R'},

                {state: 5, symbols: [0], new_state: 2, new_symbols: [5], move: 'L'}
        ],
            states: [{name: 'Q0', description: 'Initial state'}, {name: 'Q1', description: ''},
                {name: 'Q2', description: ''}, {name: 'Q3', description: ''}, {name: 'Q4', description: ''},
                {name: 'Q5', description: ''}, {name: 'Q6', description: ''}, {name: 'Q7', description: ''},
                {name: 'Q8', description: ''}, {name: 'Q9', description: 'Terminate state'}],
            symbols: [{name: '', description: 'Empty symbol'}, {name: '1', description: '1 in unary numeral system'},
                {name: 'x', description: ''}, {name: '=', description: ''}, {name: 'a', description: ''},
                {name: '*', description: ''}]})
    }
}
