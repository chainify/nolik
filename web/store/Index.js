import { action, observable } from 'mobx';

class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable fakeHeaders = [0,1,2,3,4,5,6];
    @observable showGroupInfoModal = false;
    @observable showNewGroupMembersModal = false;

    @observable currentStep = 0;
    @observable searchValue = '';
    @observable newGroupMembers = [];
    @observable newGroupName = '';
    @observable forwardPreviousMessages = true;

    @action
    resetNewGroupMember() {
        const { cdm } = this.stores;
        this.currentStep = 0;
        this.searchValue = '';
        this.newGroupMembers = [];
        this.forwardPreviousMessages = true;
        cdm.forwardedList = null;
    }
}

export default AliceStore;

