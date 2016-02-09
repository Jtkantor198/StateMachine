module.exports = function (states){
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
				this.destructors[array[i]].apply(this, args);
			}
			array = this[this.currentState].transitions[stateName];
			for (i in array){
				this.transitions[array[i]].apply(this, [this[this.currentState], this[stateName]].concat(args));
			}
			this.currentState = stateName;
			array = this[this.currentState].constructors;
			for (i in array){
				this.constructors[array[i]].apply(this, args);
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