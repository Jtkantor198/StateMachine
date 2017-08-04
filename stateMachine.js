/**
@class StateMachine
@classdesc Provides safe transitions between states
@param canvas {canvas} canvas on which to draw board
	<Attributes>
		@prop states {array} Array of all states.
		@prop currentState {String} The current state of the state machine.
		@prop constructors {array} Array of all constructor functions for all states.
		@prop transitions {array} Array of all transition functions for all states.
		@prop destructors {array} Array of all destructor functions for all states.
	<Methods>
		@prop start(string_state) {function} Starts the StateMachine in the given state. (Calls contructors for that state)
		@prop createState(string_state(s)) {function} Add state or list of states to the StateMachine. Ex: "state1, state2"
		@prop createTransition(string_transition,function_transition) {function} Adds transition between two states or groups of states and a transition function which will be run during the transition (between the destructor and constructor). Ex: "(state1, state2) -> state3", "state1 <-> state2"
		@prop createConstructor(string_state(s),function_constructor) {function} Adds a constructor for a state or list of states which will run when entering the state.
		@prop createDestructor(string_state(s),function_destructor) {function} Adds a destructor for a state or list of states which will run when leaving the state.
		@prop transitionTo(state) {function} Transitions to the provided state. Calls destructor(s) for currentState, transition function(s) to new state, and constructor(s) for new state.
		@prop addParent(stateMachine,state) {function} Adds a parentState (of another stateMachine, parentMachine) for this StateMachine so that the parentMachine will transtion to the given parentState when a transtionTo is called of this stateMachine.
*/
function StateMachine(states){
	if (typeof states == "string"){
		this.states = states.split(",");
		for (i in this.states){
			this.states[i] = this.states[i].trim();
			this[this.states[i]] = {constructors: [], transitions: {}, destructors: [0], children: []};
		}
		for (i in this.states){
			for (j in this.states){
				if (i != j){
					this[this.states[i]].transitions[this.states[j]] = [];
				}
			}
		}
	}
	else{
		this.states = [];
	}
	this.currentState = null;
	this.constructors = [];
	this.transitions = [];
	this.destructors = [function(){
		if (typeof this[this.currentState] != "undefined"){
			array = this[this.currentState].children;
			for (i in array){
				destructors = array[i][array[i].currentState].destructors;
				for (j in destructors){
					array[i].destructors[destructors[j]]();
				}
			}
		}
	}];
	this.start = function(stateName){
		args = [];
		for (i=1;i<arguments.length;i++){
			args.push(arguments[i]);
		}
		if (this.states.indexOf(stateName) == -1){
			throw new Error(stateName + " is not a defined state.");
		}
		else{
			this.currentState = stateName;
			array = this[this.currentState].constructors;
			for (i in array){
				this.constructors[array[i]].apply(this, args);
			}
		}
	};
	this.createState = function(newStates){
		newStates = newStates.split(",");
		for (i in newStates){
			newStates[i] = newStates[i].trim();
			if (this.states.indexOf(newStates[i]) != -1){
				throw new Error(newStates[i] + " is already a defined state.");
				return 0;
			}
			else{
				this[newStates[i]] = {constructors: [], transitions: {}, destructors: [0], children: []};
			}
		}
		for (i in this.states){
			for (j in newStates){
				this[this.states[i]].transitions[newStates[j]] = [];
			}
		}
		this.states = this.states.concat(newStates);
		for (i in newStates){
			for (j in this.states){
				if (newStates[i] != this.states[j]){
					this[newStates[i]].transitions[this.states[j]] = [];
				}
			}
		}
	};
	this.createTransition = function(transitionString, transition){
		invertable = transitionString.split('<->');
		stateNames = {};
		//Is it invertable?
		if (invertable[0] != transitionString){
			stateNames.stateNamesLeft = invertable[0].trim();
			stateNames.stateNamesRight = invertable[1].trim();
			invertable = true;
		}
		//Is is one way?
		else{
			oneWay = transitionString.split('->');
			if (oneWay[0] != transitionString){
				stateNames.stateNamesLeft = oneWay[0].trim();
				stateNames.stateNamesRight = oneWay[1].trim();
			}
		}
		//seperate and trim names
		for (side in stateNames){
			stateNames[side] = stateNames[side].split(",");
			if(stateNames[side][0][0] == "(" && stateNames[side][stateNames[side].length-1][stateNames[side][stateNames[side].length-1].length-1] == ")"){
				stateNames[side][0] = stateNames[side][0].replace("(","");
				stateNames[side][stateNames[side].length-1] = stateNames[side][stateNames[side].length-1].replace(")","");
				for (i in stateNames[side]){
					stateNames[side][i] = stateNames[side][i].trim();
				}
			}
			else if(stateNames[side].length == 1){
				stateNames[side][0] = stateNames[side][0].trim();
			}
			else{
				throw new Error("States not found or improperly fomatted");
			}
		}
		//Create transitions
		for (i in stateNames.stateNamesLeft){
			for (j in stateNames.stateNamesRight){
				if (stateNames.stateNamesRight[j] != stateNames.stateNamesLeft[i]){
					this[stateNames.stateNamesLeft[i]].transitions[stateNames.stateNamesRight[j]].push(this.transitions.length.toString());
				}
				if (invertable == true){
					if (!(stateNames.stateNamesRight[j] in stateNames.stateNamesLeft)){
						this[stateNames.stateNamesRight[j]].transitions[stateNames.stateNamesLeft[i]].push(this.transitions.length);
					}
					else if (!(stateNames.stateNamesLeft[i] in stateNames.stateNamesRight)){
						StateMachine[stateNames.stateNamesRight[j]].transitions[stateNames.stateNamesLeft[i]].push(this.transitions.length);
					}
				}
			}
		}
		this.transitions.push(transition);
	};
	this.createConstructor = function(states, callback){
		states = states.split(",");
		for (i in states){
			states[i] = states[i].trim();
			this[states[i]].constructors.push(this.constructors.length);
			this.constructors.push(callback);
		}
	};
	this.createDestructor = function(states, callback){
		states = states.split(",");
		for (i in states){
			states[i] = states[i].trim();
			this[states[i]].destructors.push(this.destructors.length);
			this.destructors.push(callback);
		}
	};
	//Extra arguments passed to transitionTo passed to all constructors as the arguments array
	function transitionTo(stateName){
		args = [];
		for (i=1;i<arguments.length;i++){
			args.push(arguments[i]);
		}
		if (this.currentState == null){
			throw new Error("transition called with a currentState");
		}
		if (typeof this[this.currentState].transitions[stateName] == "undefined"){
			throw new Error("Already in state " + stateName);
		}
		else if (this[this.currentState].transitions[stateName].length == 0){
			throw new Error(this.currentState + " has no transition to " + stateName);
		}
		else{
			var array = this[this.currentState].destructors;
			for (i in array){
				this.destructors[array[i]].apply(this, [this[this.currentState]].concat(args));
			}
			array = this[this.currentState].transitions[stateName];
			for (i in array){
				this.transitions[array[i]].apply(this, [this[this.currentState], this[stateName]].concat(args));
			}
			this.currentState = stateName;
			array = this[stateName].constructors;
			for (i in array){
				this.constructors[array[i]].apply(this, [this[stateName]].concat(args));
			}
		}
	};
	this.transitionTo = transitionTo;
	this.addParent = function(stateMachine, state){
		stateMachine[state].children.push(this);
		this.transitionTo = function(stateName){
			if (stateMachine.currentState == state){
				transitionTo.apply(this, arguments);
			}
			else{
				caught = false;
				try{
					stateMachine.transitionTo(state);
				}
				catch (Error){
					caught = true;
				}
				finally{
					if (caught){
						throw new Error("Parent transition failed.");
					}
					else{
						transitionTo.apply(this, arguments);
					}
				}
			}
		};
	};
};

module.exports = StateMachine;

/*
The MIT License (MIT)

Copyright (c) 2017 Justin Kantor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
