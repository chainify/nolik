import React from 'react';
import PropTypes from 'prop-types';
import { autorun, toJS } from 'mobx';
import { observer, inject } from 'mobx-react';

import Main from './app/main';
import Drawer from './app/drawer';
import Loading from './app/loading';
import Share from './app/modals/share';
import Welcome from './app/modals/welcome';
import LogIn from './app/modals/login';
import Backup from './app/modals/backup';
import Switch from './app/modals/switch';
import Password from './app/modals/password';
import DropAccounts from './app/modals/dropAccounts';
import ImportBackupPhrase from './app/modals/import';

@inject('app', 'threads', 'heartbeat', 'chat', 'contacts')
@observer
class App extends React.Component {
  constructor(props) {
    super(props);
    const { app, threads, heartbeat, contacts } = this.props;

    autorun(() => {
      if (app.seed) {
        app.initSettingsDB();
        threads.initLevelDB();
        contacts.initLevelDB();
        contacts.readPinned();
        contacts.readSaved();
      }
    });

    autorun(() => {
      if (
        app.seed &&
        contacts.list === null &&
        contacts.pinned !== null &&
        contacts.saved !== null
      ) {
        contacts.createList();
      }
    });

    autorun(() => {
      if (app.seed && threads.list === null && contacts.list !== null) {
        threads.readList();
      }
    });

    autorun(() => {
      if (
        app.seed &&
        heartbeat.heartbeatStatus === 'init' &&
        threads.list !== null
      ) {
        heartbeat.push();
      }
    });

    this.heartbeatPeriodic = autorun(() => {
      if (
        app.seed &&
        ['success', 'error'].indexOf(heartbeat.heartbeatStatus) > -1
      ) {
        heartbeat.push();
      }
    });
  }

  componentDidMount() {
    const { app } = this.props;
    app.initAccountsDB();
    app.initAppDB();
    app.init();
  }

  componentWillUnmount() {
    const { app } = this.props;
    this.heartbeatPeriodic();
    app.logOut();
  }

  render() {
    const { app, threads, chat } = this.props;
    return (
      <div>
        <Welcome />
        <LogIn />
        <Backup />
        <Switch />
        <Password />
        <ImportBackupPhrase />
        <DropAccounts />
        {app.seed && <Share />}
        {app.accounts && <Drawer />}
        <div className={`main ${chat.focusMode ? 'focused' : ''}`}>
          <div className="container">
            {app.accounts !== null && threads.list !== null ? (
              <Main />
            ) : (
              <Loading />
            )}
          </div>
        </div>
        <style jsx>{`
          .main {
            height: 100vh;
            background: #f5f5f5;
          }

          .main.focused {
            background: #fff;
          }

          .container {
            height: 100vh;
            max-width: 1024px;
            margin-left: auto;
            margin-right: auto;
            background: #fff;
          }
        `}</style>
      </div>
    );
  }
}

App.propTypes = {
  app: PropTypes.object,
  threads: PropTypes.object,
  heartbeat: PropTypes.object,
  chat: PropTypes.object,
  contacts: PropTypes.object,
};

export default App;
