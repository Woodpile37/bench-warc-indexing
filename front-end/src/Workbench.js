import React from "react";

import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button"; 

import SearchTab from "./SearchTab";
import Writeup from "./Writeup";
import TopicList from "./TopicList";

function initial_bench_state() {
  return {
	username: null,
	login_required: true,
	qrels: new Map(),
	writeup: {
	  title: "",
	  desc: "",
	  narr: "",
	},
	topics: [],
	cur_topic: -1
  };
}

class Workbench extends React.Component {
  constructor(props) {
	super(props);
	this.state = initial_bench_state();

	this.set_username = this.set_username.bind(this);
	this.login_complete = this.login_complete.bind(this);
	this.add_relevant = this.add_relevant.bind(this);
	this.remove_relevant = this.remove_relevant.bind(this);
	this.change_writeup = this.change_writeup.bind(this);
	this.save_topic = this.save_topic.bind(this);
	this.load_topic = this.load_topic.bind(this);
	this.delete_topic = this.delete_topic.bind(this);
	this.new_topic = this.new_topic.bind(this);
  }

  clear_state() {
	this.setState(initial_bench_state());
  }

  /*
   * JSON.stringify serializes Maps as plain objects, so we need to handle their
   * conversion in stringify and parse so when we restore them, we get maps.
   */
  JSON_stringify_maps(key, value) {
	const original = this[key];
	if (original instanceof Map) {
	  /* Serialize the Map as an object with a type and an array for the values */
	  return {
		dataType: "Map",
		value: [...original]
	  };
	} else {
	  return value;
	}
  }

  JSON_revive_maps(key, value) {
	if (typeof value === "object" && value !== null) {
	  if (value.dataType === "Map") {
		return new Map(value.value);
	  }
	}
	return value;
  }

  /*
   * Restore app state from browser local-storage.
   */
  restore_state() {
	let bench_state = localStorage.getItem('bench_state');
	if (bench_state) {
	  let new_state = JSON.parse(bench_state, this.JSON_revive_maps);
	  new_state.state_is_live = true;
	  if (new_state.username === null)
		new_state.login_required = true;
	  this.setState(new_state);
	}
  }

  /*
   * Save the app state to the browser local-storage.
   */
  save_state() {
	let bench_state = JSON.stringify(this.state, this.JSON_stringify_maps);
	localStorage.setItem('bench_state', bench_state);
  }

  set_username(event) {
	this.setState({ username: event.target.value });
  }

  login_complete(event) {
	if (this.state.username !== null)
	  this.setState({ login_required: false });
  }
  
  /* Note a relevant document. */
  add_relevant(docno) {
	let qrels = this.state.qrels;
	qrels.set(docno, true);
	this.setState({ qrels: qrels });
  }

  /* Remove a relevant document */
  remove_relevant(docno) {
	let qrels = this.state.qrels;
	qrels.delete(docno);
	this.setState({ qrels: qrels });
  }

  /* Note a change to the topic writeup */
  change_writeup(name, value) {
	let writeup = this.state.writeup;
	writeup[name] = value;
	this.setState({ writeup: writeup });
  }

  /* Save the current writeup and qrels to the topics array. */
  save_topic() {
	let cur_topic = this.state.cur_topic;
	let topics = this.state.topics;
	let topic_to_save = {
	  writeup: JSON.stringify(this.state.writeup),
	  qrels: JSON.stringify(this.state.qrels, this.JSON_stringify_maps)
	};
	if (cur_topic == -1) {
	  cur_topic = this.state.topics.length;
	}
	topics[cur_topic] = topic_to_save;
	this.setState({ topics: topics,
					cur_topic: cur_topic,
				  });
  }

  /* Take a topic from the topics array and populate the writeup and qrels */
  load_topic(topic_num) {
	if (topic_num < 0 || topic_num > this.state.topics.length)
	  return;
	let topic_to_load = this.state.topics[topic_num];
	this.setState({ cur_topic: topic_num,
					writeup: JSON.parse(topic_to_load.writeup, this.JSON_revive_maps),
					qrels: JSON.parse(topic_to_load.qrels, this.JSON_revive_maps)
				  });
  }

  /* Remove a topic from the topics array.  This is a function from the topic browser tab. */
  delete_topic(topic_num) {
	if (topic_num < 0 || topic_num > this.state.topics.length)
	  return;
	let topics = this.state.topics;
	topics.splice(topic_num, 1);
	this.setState({ cur_topic: -1,
					topics: topics
				  });
  }

  /* Clear the writeup and qrels, and start a new topic. */
  new_topic() {
	this.setState({cur_topic: -1,
				   qrels: new Map(),
				   writeup: {
					 title: "",
					 desc: "",
					 narr: ""
				   }});
  }
  
  componentDidUpdate() {
	this.save_state();
  }

  componentDidMount() {
	if (!this.state.hasOwnProperty('state_is_live')) {
	  this.restore_state();
	}
  }

  render() {
    return (
	  <>
	  <Modal show={this.state.login_required} onHide={this.login_complete}
			 backdrop="static" keyboard={false}>
		<Modal.Header>
		  <Modal.Title>Please log in</Modal.Title>
		</Modal.Header>
		<Modal.Body>
		  <Form.Control type="text"
						value={this.state.username} onChange={this.set_username}/>
		</Modal.Body>
		<Modal.Footer>
		  <Button variant="primary" onClick={this.login_complete}>Log in</Button>
		</Modal.Footer>
	  </Modal>
      <Tabs defaultActiveKey="search" id="workbench">
        <Tab eventKey="search" title="Search">
		  <SearchTab qrels={this.state.qrels}
					 add_relevant={this.add_relevant}
					 remove_relevant={this.remove_relevant}/>
        </Tab>
        <Tab eventKey="writeup" title="Write-Up">
          <Writeup qrels={this.state.qrels}
				   writeup={this.state.writeup}
				   change_writeup={this.change_writeup}
				   save_topic={this.save_topic}
				   new_topic={this.new_topic}/>
        </Tab>
		<Tab eventKey="topics" title="My Topics">
		  <TopicList topics={this.state.topics}
					 current_topic={this.state.cur_topic}
					 load_topic={this.load_topic}
					 delete_topic={this.delete_topic}/>
		</Tab>
		<Tab title={"Logged in as " + this.state.username} disabled></Tab>
      </Tabs>
	  </>
    );
  }
}

export { Workbench as default };
