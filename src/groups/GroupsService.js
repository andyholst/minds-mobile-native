import api from './../common/services/api.service';
import { InteractionManagerStatic } from 'react-native';


/**
 * Groups Service
 */
class GroupsService {

  currentFilter = 'activity';

  /**
   * Load groups
   */
  loadList(filter, offset) {

    if (this.listController) {
      this.listController.abort();
    }
    // abortable call controller
    this.listController = new AbortController();

    return api.get('api/v1/groups/' + filter, { limit: 12, offset: offset }, this.listController.signal)
      .then((data) => {
        if (offset && data.groups) {
          data.groups.shift();
        }
        return {
          entities: data.groups || [],
          offset: data['load-next'] || '',
        };
      });
  }

  /**
   * Load a single group
   * @param {string} guid
   */
  loadEntity(guid) {
    return api.get('api/v1/groups/group/'+ guid)
      .then((response) => {
        return response.group;
      });
  }

  /**
   * Load the group feed
   * @param {string} guid
   * @param {string} offset
   * @param {string} filter
   */
  loadFeed(guid, offset, filter = 'activity') {
    let endpoint;

    if (filter == 'review') {
      endpoint = `api/v1/groups/review/${guid}`;
    } else {
      endpoint = `api/v1/newsfeed/container/${guid}`;
    }

    return api.get(endpoint, { limit: 12, offset })
      .then((response) => {
        if (filter !== this.currentFilter) {
          return; // Prevents race condition
        }

        this.currentFilter = filter;

        return {
          adminqueueCount: response['adminqueue:count'],
          entities: response.activity || [],
          offset: response['load-next'] || ''
        }
      });
  }

  /**
   * Load the members of the group
   * @param {string} guid
   * @param {string} offset
   * @param {integer} limit
   */
  loadMembers(guid, offset, limit = 21) {
    return api.get('api/v1/groups/membership/' + guid, {limit, offset});
  }

  /**
   * Search for members
   * @param {string} guid
   * @param {string} offset
   * @param {integer} limit
   * @param {string} q
   */
  searchMembers(guid, offset, limit = 21, q) {
    return api.get('api/v1/groups/membership/' + guid + '/search', {limit, offset, q});
  }

  /**
   * Join group
   * @param {string} guid
   */
  join(guid) {
    return api.put('api/v1/groups/membership/' + guid);
  }

  /**
   * Leave group
   * @param {string} guid
   */
  leave(guid) {
    return api.delete('api/v1/groups/membership/' + guid);
  }

  /**
   * Ban of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  ban(group_guid, user_guid) {
    return api.post(`api/v1/groups/membership/${group_guid}/ban`, {user: user_guid});
  }

  /**
   * Kick of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  kick(group_guid, user_guid) {
    return api.post(`api/v1/groups/membership/${group_guid}/kick`, {user: user_guid});
  }
  /**
   * Make owner of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  makeOwner(group_guid, user_guid) {
    return api.put(`api/v1/groups/management/${group_guid}/${user_guid}`);
  }

  /**
   * Revoke ownership of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  revokeOwner(group_guid, user_guid) {
    return api.delete(`api/v1/groups/management/${group_guid}/${user_guid}`);
  }

  /**
   * Make moderator of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  makeModerator(group_guid, user_guid) {
    return api.put(`api/v1/groups/management/${group_guid}/${user_guid}/moderator`);
  }

  /**
   * Revoke moderation of the group
   * @param {string} group_guid
   * @param {string} user_guid
   */
  revokeModerator(group_guid, user_guid) {
    return api.delete(`api/v1/groups/management/${group_guid}/${user_guid}/moderator`);
  }
}

export default new GroupsService();