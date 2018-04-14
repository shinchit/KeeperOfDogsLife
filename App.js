/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import twitter, {auth} from 'react-native-twitter';
import axios from 'axios';
import Auth0 from 'react-native-auth0';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import TodoInput from './src/component/TodoInput';
import TodoItem from './src/component/TodoItem';
import TwitterItem from './src/component/TwitterItem';

const Realm = require('realm');
const auth0 = new Auth0({ domain: 'keeperofdogslife.auth0.com', clientId: 'eFGjMakmjN87o9RTkjlqU9auwfTzaZPp' });

const CredentialsSchema = {
  name: 'Credentials',
  primaryKey: 'id',
  properties: {
    id: 'int',
    accessToken:  'string',
    expiresIn: {type: 'int', default: 0},
  }
};

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      list: [],
      tweets: [],
      realm: null,
    };
  }

  _delete = (index) => () => {
    const list = [].concat(this.state.list);
    list.splice(index, 1);

    this.setState({
      list,
    });
  }

  _done = (index) => () => {
    const list = [].concat(this.state.list);
    list[index].done = !list[index].done;

    this.setState({
      list,
    });
  }

  _onPress = (text) => {
    const list = [].concat(this.state.list);
    const tweets = [].concat(this.state.tweets);
    const {
      realm
    } = this.state;

    list.push({
      key: Date.now(),
      text: text,
      done: false,
    });

    const obj = this.state.realm.objects('Credentials').sorted('id', true).slice(0, 1)[0];
    const accessToken = obj.accessToken

    axios.get('https://keeperofdogslife.auth0.com/api/v2/users/twitter|87093541', { headers: {'Authorization': `Bearer ${accessToken}`}})
      .then(response => {
        const tokens = {
          consumerKey: '5X8dJ7c73spwLJmEFJkqn7GS3',
          consumerSecret: 'O0ONB4HcqliZk0M3hBX7vG4RcSeoQGchcY532yj1CpWPMYW1Nn',
          accessToken: response.data.identities[0].access_token,
          accessTokenSecret: response.data.identities[0].access_token_secret,
        };
        const {rest, stream} = twitter(tokens);
        const params = {q: `${text} filter:images`};
        rest.get('search/tweets', params)
          .then(response => {
            console.log(response);
            for (var i=0; i<response.statuses.length; i++) {
              tweets.push({
                key: response.statuses[i].id,
                text: response.statuses[i].text,
              });
            }
            this.setState({
              list,
              tweets,
            });
          })
          .catch(error => {
            console.log(error);
          });
    })
    .catch(error => {
      console.log(error);
    });

  }

  componentDidMount() {
    axios.post('https://keeperofdogslife.auth0.com/oauth/token',
      {
        headers: { 'content-type': 'application/json' },
        client_id: 'eFGjMakmjN87o9RTkjlqU9auwfTzaZPp',
        client_secret: 'cAUghlkNOtOVo3Jf6U1AEgt_3kReFhk4WfjvxQQZ7zmLyT1PPmRzzES-bquoXn0z',
        audience: 'https://keeperofdogslife.auth0.com/api/v2/',
        grant_type: 'client_credentials',
      })
      .then(response => {
        console.log('body:', response.data);
        Realm.open({schema: [CredentialsSchema], schemaVersion: 1})
          .then(realm => {
            this.setState({ realm });
            const id = realm.objects('Credentials').length + 1;
            realm.write(() => {
              console.log(response.data.access_token);
              const myCredentials = realm.create('Credentials', {
                id: id,
                accessToken: response.data.access_token,
                expiresIn: response.data.expires_in,
              });
            });
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  render() {
    const {
      list,
      tweets,
    } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.main}>
          <TodoInput onPress={this._onPress} />
          <View style={styles.todoListContainer}>
            <FlatList
              style={styles.todoList}
              data={list}
              renderItem={({ item, index }) => (
                <TodoItem
                  onDone={this._done(index)}
                  onDelete={this._delete(index)}
                  {...item}
                />
              )}
            />
          </View>
          <View style={styles.todoListContainer}>
            <FlatList
              style={styles.todoList}
              data={tweets}
              renderItem={({ item, index }) => (
                <TwitterItem {...item} />
              )}
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    paddingTop: 40,
    alignItems: 'center',
  },
  main: {
    flex: 1,
    maxWidth: 400,
    alignItems: 'center',
  },
  todoListContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  todoList: {
    paddingLeft: 10,
    paddingRight: 10,
  }
});
