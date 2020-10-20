import React, {useCallback, useContext, useEffect, useState} from 'react';
import {observer} from "mobx-react";
import { LocalState, Rule, State, Symbol, Tape, Program, Session} from "./Storage";
import './App.css';

const LocalStateContext = React.createContext(null);

const Frame = observer((props: {fr: number, ind: number, color: string, ind2: number}) => {
    const state = useContext(LocalStateContext);

    const handleFrameChange = useCallback((e: any) => {
        state.handleFramechange(e, props.ind, props.ind2)
    }, [])

    return (<input onChange={handleFrameChange} className="frame" style={{background : props.color, color: 'black'}}
                   value={state.symbols[props.fr].name} disabled={state.run_mode}/>);
})

const Tapes = observer(() => {
    const state = useContext(LocalStateContext);
    const cont = state.machine[state.history_pos].tapes.map(
        (bobbin: Tape, index1: number) => {
            return (
                <ul className="tape">
                    {bobbin.tape.map(
                        (frame: number, index0: number) => {
                            return (
                                <Frame
                                    fr={frame}
                                    ind={index0}
                                    color={bobbin.pos === index0 ? 'green' : 'gray'}
                                    ind2={index1}
                                />
                            )
                        }
                    )}
                </ul>
            );
        }
    );
    return (
        <ul className="tape-group" >
            <h3 style={{paddingLeft: '45px', fontSize: '110%'}}>Tape</h3>
            {cont}
            <p style={{margin: '50px', border: 'none'}}>{'Current state: ' +
            state.states[state.machine[state.history_pos].state].name}</p>
        </ul>
    );
})

const Controls = observer( () => {
    const state = useContext(LocalStateContext);

    const handleStep = useCallback( () => {
        state.handlestep();
    }, [])

    const handleTapeBack = useCallback( () => {
        state.handleTapeback();
    }, [])

    const handleInputMode = useCallback(() => {
        state.handleInputmode();
    }, [])

    const handleTestMode = useCallback(() => {
        state.handleTestmode();
    }, [])

    return (
        <a>
            <ul className='controls'>
                <p style={{fontSize: '110%'}}>Controls</p>
                <button onClick={handleTapeBack} disabled={!state.run_mode}>Back</button>
                <button onClick={handleStep} disabled={!state.run_mode}>Step</button>
            </ul>
            <ul className='controls'>
                <p style={{fontSize: '110%'}}>Chose mode</p>
                <button onClick={handleInputMode} style={{background: !state.run_mode ?
                        'rgb(200, 235, 200)' : '#ffdcdc', border: !state.run_mode ? '2px solid black' : 'none'}}
                >Input mode</button>
                <button onClick={handleTestMode} style={{background: !state.run_mode ?
                        '#ffdcdc' : 'rgb(200, 235, 200)', border: state.run_mode ? '2px solid black' : 'none'}}
                >Test mode</button>
            </ul></a>
    )
})

const OneSymbol = observer((props: { sym: Symbol, index: number }) => {
    const state = useContext(LocalStateContext);

    const handleSymbolNameChange =  useCallback((e: any) => {
        state.handleSymbolNamechange(e, props.index);
    }, []);

    const handleSymbolDescChange = useCallback((e: any) => {
        state.handleSymbolDescchange(e, props.index);
    }, []);

    const handleRemoveSymbol = useCallback(() => {
        state.handleRemovesymbol(props.index);
    }, [])

    let desc;
    if (props.sym.name !== state.symbols[0].name &&
        state.rules.filter((rule: Rule) => rule.symbols[0] === props.index).length +
        state.rules.filter((rule: Rule) => rule.new_symbols[0] === props.index).length +
        state.machine[state.history_pos].tapes[0].tape.filter((frame: number) => frame === props.index).length === 0) {
        desc = <a>
            <input type="text" className="a" value={props.sym.description} style={{width: '60%'}}
                   onChange={handleSymbolDescChange}  disabled={state.run_mode}/>
            <button style={{width: '20%', background: '#ffdcdc', border: 'none'}} onClick={handleRemoveSymbol}
                    disabled={state.run_mode}>Remove unused symbol</button>
        </a>
    } else {
        desc = <a><input type="text" className="a" value={props.sym.description} style={{width: '80%'}}
                         onChange={handleSymbolDescChange}  disabled={state.run_mode}/></a>
    }

    return (
        <div>
            <input className="state" value={props.sym.name} style={{width: '15%'}}
                   onChange={handleSymbolNameChange} disabled={state.run_mode}/>
            {desc}
        </div>
    );
})

const Symbols = observer(() => {
    const state = useContext(LocalStateContext);
    const cont = state.symbols.map( (psym: Symbol, pindex: number) => {
        return (
            <OneSymbol
                sym={psym}
                index={pindex}
            />
        );
    });

    return (
        <ul className="states-group"  >
            <p style={{fontSize: '110%'}}>Symbols</p>
            <div>
                <input className="state" value='Symbol' style={{width: '15%', background: '#D0D0D0'}}/>
                <input type="text" className="a" value='Description' style={{width: '80%', background: '#D0D0D0'}}/>
            </div>
            {cont}
        </ul>
    );
})

const OneState = observer( (props: {st: State, index: number}) => {
    const state = useContext(LocalStateContext);

    const handleStateNameChange = useCallback((e: any) => {
        state.handleStateNamechange(e, props.index);
    }, []);

    const handleStateDescChange = useCallback((e: any) => {
        state.handleStateDescchange(e, props.index);
    }, []);

    const handleRemoveState = useCallback(() => {
        state.handleRemovestate(props.index);
    }, [])

    let desc;
    if (props.st.name !== state.states[0].name &&
        state.rules.filter((rule: Rule) => rule.state === props.index).length +
        state.rules.filter((rule: Rule) => rule.new_state === props.index).length === 0) {
        desc = <a>
            <input type="text" className="a" value={props.st.description} style={{width: '65%'}}
                   onChange={handleStateDescChange}  disabled={state.run_mode}/>
            <button style={{width: '15%', background: '#ffdcdc', border: 'none'}} onClick={handleRemoveState}
                    disabled={state.run_mode}>Remove unused state</button>
        </a>
    } else if (state.rules.filter((rule: Rule) => rule.new_state === props.index).length > 0 &&
        state.rules.filter((rule: Rule) => rule.state === props.index).length == 0) {
        desc = <a>
            <input type="text" className="a" value={props.st.description} style={{width: '70%'}}
                   onChange={handleStateDescChange} disabled={state.run_mode}/>
            <a style={{width: '10%', background: '#D0D0D0', border: 'none'}}>Terminate state</a>
        </a>
    } else {
        desc = <a><input type="text" className="a" value={props.st.description} style={{width: '80%'}}
                         onChange={handleStateDescChange} disabled={state.run_mode}/></a>
    }

    return (
        <div>
            <input className="state" value={props.st.name} style={{width: '15%'}}
                   onChange={handleStateNameChange} disabled={state.run_mode}/>
            {desc}
        </div>
    );
})

const States = observer(() => {
    const state = useContext(LocalStateContext);

    const cont = state.states.map( (pst: State, pindex: number) => {
            return (
                <OneState
                    st={pst}
                    index={pindex}
                />
            );
        }
    );

    return (
        <ul className="states-group"  >
            <p style={{fontSize: '110%'}}>States</p>
            <div>
                <input className="state" value='State' style={{width: '15%', background: '#D0D0D0'}}
                       disabled={state.run_mode}/>
                <input type="text" className="a" value='Description' style={{width: '80%', background: '#D0D0D0'}}
                       disabled={state.run_mode}/>
            </div>
            {cont}
        </ul>
    );
})

const OneRule = observer((props: {rule: Rule, index?: number}) => {
    const state: LocalState = useContext(LocalStateContext);
    let index: number;

    if (props.index) {
        index = props.index;
    } else {
        index = state.rules.findIndex(rule => rule.state === props.rule.state &&
            rule.symbols[0] === props.rule.symbols[0]);
    }

    const handleRuleStateChange = useCallback((e: any) => {
        state.handleRuleStatechange(e, index);
    }, []);

    const handleRuleSymbolChange = useCallback((e: any) => {
        state.handleRuleSymbolchange(e, index);
    }, []);

    const handleRuleMoveChange = useCallback((e: any) => {
        state.handleRuleMovechange(e, index);
        e.target.select();
    }, []);

    const handleRuleMoveFocus = (e: any) => e.target.select();

    const handleRuleNew_StateChange = useCallback((e: any) => {
        state.handleRuleNew_Statechange(e, index);
    }, []);

    const handleRuleNew_SymbolChange = useCallback((e: any) => {
        state.handleRuleNew_Symbolchange(e, index);
    }, []);

    const handleRemoveRule = useCallback(() => {
        state.handleRemoverule(index);
    }, []);

    const state_text = state.states[props.rule.state].name;
    const symbol_text = state.symbols[props.rule.symbols[0]].name;
    const new_state_text = state.states[props.rule.new_state].name;
    const new_symbol_text = state.symbols[props.rule.new_symbols[0]].name;

    return (
        <div className="rule" style={{ float: 'left'}}>
            <p style={{float: 'left'}}>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>&nbsp;</a>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>State:&nbsp;</a>
                <input type="text" style={{color: 'black', background: 'white', border: 'none'}}
                       size={state_text.length + 1} value={state_text} onChange={handleRuleStateChange}
                       disabled={state.run_mode}/>
            </p>
            {props.rule.symbols.map(
                (sym: number, tape: number) => {
                    return (
                        <p style={{float: 'left'}}>
                            <a style={{color: '#555555', background: 'rgb(243, 238, 170)'}}>&nbsp;</a>
                            <a style={{color: '#555555', background: 'rgb(243, 238, 170)'}}>Symbol:&nbsp;</a>
                            <input type="text" style={{color: 'black', background: 'white', border: 'none'}}
                                   size={symbol_text.length + 1} value={symbol_text} onChange={handleRuleSymbolChange}
                                   disabled={state.run_mode}/>
                        </p>
                    )
                }
            )}
            <p style={{float: 'left'}}>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>&nbsp;</a>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>Move:&nbsp;</a>
                <input type="text" style={{color: 'black', background: 'white', border: 'none'}}
                       size={1} value={props.rule.move} onChange={handleRuleMoveChange}
                       onFocus={handleRuleMoveFocus} disabled={state.run_mode}/>
            </p>
            <br/>
            <p style={{float: 'left'}}>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>&nbsp;</a>
                <a style={{color: '#585858', background: 'rgb(200, 235, 200)'}}>New state:&nbsp;</a>
                <input type="text" style={{color: 'black', background: 'white', border: 'none'}}
                       size={new_state_text.length + 1} value={new_state_text} onChange={handleRuleNew_StateChange}
                       disabled={state.run_mode}/>
            </p>
            {props.rule.new_symbols.map(
                (sym: number, tape: number) => {
                    return (
                        <p style={{float: 'left'}}>
                            <a style={{color: '#555555', background: 'rgb(243, 238, 170)'}}>&nbsp;</a>
                            <a style={{color: '#555555', background: 'rgb(243, 238, 170)'}}>New symbol:&nbsp;</a>
                            <input type="text" style={{color: 'black', background: 'white', border: 'none'}}
                                   size={new_symbol_text.length + 1} value={new_symbol_text}
                                   onChange={handleRuleNew_SymbolChange} disabled={state.run_mode}/>
                        </p>
                    )
                }
            )}
            <button style={{border: 'none', background: '#ffdcdc'}} onClick={handleRemoveRule}
                    disabled={state.run_mode}>Remove rule</button>
        </div>
    );
})

const Rules = observer(() => {
    const state = useContext(LocalStateContext);

    const handleAddRule = useCallback((e: any) => {
        state.handleAddrule();
    }, []);

    const cont = state.rules.map(
        (p_rule: Rule, ind: number) => {
            return (
                <div className='rule_container'>
                    <OneRule
                        rule={p_rule}
                        index={ind}
                    />
                </div>
            )
        }
    )
    cont.push(<button onClick={handleAddRule} disabled={state.run_mode}
                      style={{border: 'none', background: '#D0D0D0', padding: '10px', margin: '5px'}}>
        <p style={{margin: '5px'}}>Add</p><p style={{margin: '5px'}}>rule</p></button>);

    return (
        <ul className="rules-group">
            <p style={{fontSize: '110%'}}>Rules</p>
            {cont}
        </ul>
    );
})

const Table = observer(() => {
    const state: LocalState = useContext(LocalStateContext);

    const cont = state.table[0].map(
        (row: Rule[], index: number) => {
            return (
                <tr>
                    <td className='rule'>
                        {state.symbols[index].name ? state.symbols[index].name : 'None' }
                    </td>
                    {row.map(
                        (prule: Rule) => {
                            return prule === null ? <td className='rule'/> : <td style={{padding: 0}}>
                                <OneRule
                                    rule={prule}
                                />
                            </td>;
                        }
                    )}
                </tr>
            );
        }
    )
    return (
        <table>
            <tr>
                <td className='rule'/>
                {state.states.map( (st: State) => {
                    return (
                        <td className='rule'>
                            {st.name ? st.name : 'noname'}
                        </td>
                    );
                })}
            </tr>
            {cont}
        </table>
    )
})

function Row(props: { index: number, active: boolean }) {
    const state: LocalState = useContext(LocalStateContext);
    const handleTapeHistory = useCallback(() => {
        state.handleTapehistory(props.index);
    }, [])
    return (
        <button className="row" onClick={handleTapeHistory} disabled={!state.run_mode}
                style={{background: props.active ? '#c8ebc8':'#F1F1F1'}}>
            {'Step ' + props.index}
        </button>
    );
}

const History = observer(() => {
    const state: LocalState = useContext(LocalStateContext);

    const rows = state.machine.map(
        (_, ind: number) => {
            return (
                <Row
                    index={ind}
                    active={state.history_pos === ind}
                />
            );
        }
    );
    return (
        <ul className="btn-group" style={{display: 'block'}} >
            <p style={{fontSize: '110%'}}>History</p>
            {rows}
        </ul>
    );
})

const Prog = observer((props: {pr: Program | Session, i: number}) => {
    const state: LocalState = useContext(LocalStateContext);

    const handleLoadMachine = useCallback(() => {state.handleLoadmachine(props.i)}, []);
    const removeProgram = useCallback(() => {state.removeprogram(props.i)}, []);

    return (
        <p>
            <button style={{width: '60%', border: 'none'}} onClick={handleLoadMachine}>{props.pr.name}</button>
            <button style={{width: '40%', background: '#ffdcdc', border: 'none'}}
                    onClick={removeProgram}>remove</button>
        </p>
    )
})

const Programs = observer(() => {
    const state: LocalState = useContext(LocalStateContext);

    const cont = state.programs.map(
        (prog: Program | Session, ind: number) => {
            return (
                <Prog
                    pr={prog}
                    i={ind}
                />
            )
        }
    )

    const machineFromStart = useCallback(() => {state.machineFromstart()}, []);
    const machineFromActual = useCallback(() => {state.machineFromactual()}, []);
    const sessionFromState = useCallback(() => {state.sessionFromstate()}, []);
    const handlePossible_Name = useCallback((e) => {state.handlePossible_name(e)}, []);
    const cleanInput = useCallback(() => {state.cleaninput()}, []);
    const blurInput = useCallback(() => {state.blurinput()}, []);

    return (
        <ul className="mini-btn-group" style={{display: 'block'}} >
            <button style={{height: '40px', background: 'none', border: 'none'}}/>
            <p style={{fontSize: '110%'}}>Programs</p>
            {cont}
            <p style={{fontSize: '110%'}}>Save program</p>
            <input style={{marginTop: '0', marginBottom: '20px', fontStyle: state.possible_name ===
                'Input name here' ? 'italic' : 'normal', color: state.possible_name === 'Input name here' ?
                    'gray' : 'black'}} value={state.possible_name}
            onChange={handlePossible_Name} onFocus={cleanInput} onBlur={blurInput}/>
            <button style={{border: 'none', fontSize: '90%', padding: '2px', width: '100%', background: '#D0D0D0'}}
                    onClick={machineFromStart}>Program from current state</button>
            <button style={{border: 'none', fontSize: '90%', padding: '2px', width: '100%', marginTop: '10px',
                background: '#D0D0D0'}} onClick={machineFromActual}>Program from initial state</button>
            <button style={{border: 'none', fontSize: '90%', padding: '2px', width: '100%', marginTop: '10px',
                background: '#D0D0D0'}} onClick={sessionFromState}>Save current session</button>
        </ul>
    )
})

const App = observer( () => {
    const [state] = useState(() => new LocalState());

    useEffect(state.rulesEffect, []);

    return (
        <div className="App">
            <LocalStateContext.Provider value={state}>
                <div className='header'>
                    <h3 style={{margin: '0'}}>
                        Turing machine
                    </h3>
                </div>

                <div className="elements">
                    <div className="main">
                        <Tapes/>
                        <Controls/>
                        <Symbols/>
                        <States/>
                        <Rules/>
                    </div>
                    <div className="history">
                        <History/>
                        <Programs/>
                    </div>
                </div>
                <div className="table">
                    <p style={{textAlign: 'left', paddingLeft: '30px', fontSize: '110%'}}>Rule table</p>
                    <Table/>
                </div>
            </LocalStateContext.Provider>
        </div>
    );
});

export default App;
