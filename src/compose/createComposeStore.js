import { showMessage } from 'react-native-flash-message';
import RNPhotoEditor from 'react-native-photo-editor';
import { measureHeights } from '@bigbee.dev/react-native-measure-text-size';
import AttachmentStore from '../common/stores/AttachmentStore';
import RichEmbedStore from '../common/stores/RichEmbedStore';
import i18n from '../common/services/i18n.service';
import hashtagService from '../common/services/hashtag.service';
import api from '../common/services/api.service';
import ActivityModel from '../newsfeed/ActivityModel';
import ThemedStyles from '../styles/ThemedStyles';
import featuresService from '../common/services/features.service';
import mindsConfigService from '../common/services/minds-config.service';
import supportTiersService from '../common/services/support-tiers.service';
import settingsStore from '../settings/SettingsStore';
import attachmentService from '../common/services/attachment.service';
import logService from '../common/services/log.service';
import { runInAction } from 'mobx';
import { Image, Platform } from 'react-native';
import { hashRegex } from '~/common/components/Tags';
import getNetworkError from '~/common/helpers/getNetworkError';

/**
 * Display an error message to the user.
 * @param {string} message
 */
const showError = message => {
  showMessage({
    position: 'top',
    message: message,
    titleStyle: [
      ThemedStyles.style.fontXL,
      ThemedStyles.style.colorPrimaryText,
    ],
    duration: 3000,
    backgroundColor: ThemedStyles.getColor('TertiaryBackground'),
    type: 'danger',
  });
};

const DEFAULT_MONETIZE = {
  type: 'tokens',
  min: 0,
};

/**
 * Composer store
 */
export default function (props) {
  return {
    selection: {
      start: 0,
      end: 0,
    },
    textHeight: 26,
    portraitMode: false,
    noText: false,
    isRemind: false,
    isEdit: false,
    accessId: 2,
    mode: settingsStore.composerMode,
    videoPoster: null,
    entity: null,
    attachment: new AttachmentStore(),
    nsfw: [],
    tags: [],
    wire_threshold: DEFAULT_MONETIZE,
    embed: new RichEmbedStore(),
    text: '',
    title: '',
    time_created: null,
    mediaToConfirm: null,
    extra: null,
    posting: false,
    group: null,
    postToPermaweb: false,
    initialized: false,
    onScreenFocused() {
      const params = props.route.params;
      if (this.initialized || !params) {
        return;
      }
      this.initialized = true;

      this.noText = Boolean(params.noText);
      this.portraitMode = params.portrait;
      this.isRemind = params.isRemind;
      this.isEdit = params.isEdit;
      this.entity = params.entity || null;

      this.mode = params.mode
        ? params.mode
        : this.isRemind || this.isEdit
        ? 'text'
        : settingsStore.composerMode;

      // if noText is enabled the first screen shouldn't be text.
      if (this.mode === 'text' && this.noText) {
        this.mode = 'photo';
      }

      if (params.media) {
        console.log('media', params.media);
        this.mode = 'text';
        this.mediaToConfirm = params.media;
        this.attachment.attachMedia(params.media);
      }

      if (params.text) {
        this.setText(params.text);
        this.mode = 'text';
      }

      if (this.isEdit) {
        this.hydrateFromEntity();
      }

      // clear params to avoid repetition
      props.navigation.setParams({
        entity: undefined,
        media: undefined,
        mode: undefined,
        isRemind: undefined,
        text: undefined,
        portrait: undefined,
        noText: undefined,
      });
    },
    selectionChanged(e) {
      this.selection = e.nativeEvent.selection;
      const fontSmall = this.attachment.hasAttachment || this.text.length > 85;

      measureHeights({
        texts: [this.text.substr(0, this.selection.start)],
        width: 326,
        fontFamily: 'Roboto',
        fontSize: fontSmall ? 18 : 22,
      })
        .then(result => (this.textHeight = Math.max(result[0], 26)))
        .catch(err => console.error('error ======>', err));
    },
    onPost(entity, isEdit) {
      const { popToTop } = props.navigation;

      popToTop();
      this.clear(false);

      if (!isEdit) {
        ActivityModel.events.emit('newPost', entity);
      } else {
        ActivityModel.events.emit('edited', entity);
      }
    },
    hydrateFromEntity() {
      this.text = this.entity.message || '';
      this.time_created = this.entity.time_created * 1000;
      this.title = this.entity.title || '';
      this.nsfw = this.entity.nsfw || [];
      this.tags = this.entity.tags || [];
      this.wire_threshold = this.entity.wire_threshold || DEFAULT_MONETIZE;

      if (this.entity.custom_type === 'batch') {
        this.attachment.setMedia('image', this.entity.entity_guid);
        this.mediaToConfirm = {
          type: 'image',
          uri: this.entity.custom_data[0].src,
          width: this.entity.custom_data[0].width,
          height: this.entity.custom_data[0].height,
        };
      } else if (this.entity.custom_type === 'video') {
        this.attachment.setMedia('video', this.entity.entity_guid);
        this.videoPoster = { url: this.entity.custom_data.thumbnail_src };
      } else if (this.entity.entity_guid || this.entity.perma_url) {
        // Rich embeds (blogs included)
        this.embed.setMeta({
          entityGuid: this.entity.entity_guid || null,
          url: this.entity.perma_url,
          title: this.entity.title || '',
          description: this.entity.blurb || '',
          thumbnail: this.entity.thumbnail_src || '',
        });
      }
    },
    setAccessId(value) {
      this.accessId = value;
    },
    setTokenThreshold(value) {
      value = parseFloat(value);
      if (isNaN(value) || value < 0) {
        this.wire_threshold.min = 0;
      } else {
        this.wire_threshold.min = value;
      }
    },
    setTimeCreated(time) {
      this.time_created = time;
    },
    toggleNsfw(opt) {
      if (opt === 0) {
        this.nsfw = [];
      } else {
        const index = this.nsfw.indexOf(opt);
        if (index !== -1) {
          this.nsfw.splice(index, 1);
        } else {
          this.nsfw.push(opt);
        }
      }
    },
    /**
     * Edit the current post image
     */
    async editImage() {
      if (
        !this.mediaToConfirm ||
        !this.mediaToConfirm.type.startsWith('image')
      ) {
        return;
      }

      try {
        RNPhotoEditor.Edit({
          path: this.mediaToConfirm.uri.replace('file://', ''),
          stickers: ['sticker6', 'sticker9'],
          hiddenControls: ['save', 'share'],
          onDone: result => {
            Image.getSize(
              this.mediaToConfirm.uri,
              (w, h) => {
                runInAction(() => {
                  this.mediaToConfirm.key++;
                  if (
                    Platform.OS === 'android' &&
                    this.mediaToConfirm.pictureOrientation <= 2
                  ) {
                    this.mediaToConfirm.width = h;
                    this.mediaToConfirm.height = w;
                  } else {
                    this.mediaToConfirm.width = w;
                    this.mediaToConfirm.height = h;
                  }
                });
              },
              err => console.log(err),
            );
          },
        });
      } catch (err) {
        logService.exception(err);
      }
    },
    /**
     * Add tag
     * @param {string} tag
     */
    addTag(tag) {
      if (this.tags.length === hashtagService.maxHashtags) {
        this.maxHashtagsError();
        return false;
      }
      if (this.tags.some(t => t === tag)) {
        return false;
      }

      this.tags.push(tag);
      return true;
    },
    /**
     * Remove a tag
     * @param {string} tag
     */
    removeTag(tag) {
      const index = this.tags.findIndex(v => v === tag);
      if (index !== -1) {
        this.tags.splice(index, 1);
      }
    },
    parseTags() {
      let result = this.text.match(hashRegex);
      if (result) {
        // unique results
        result = result.map(v => v.trim().slice(1));
        const all = [...new Set(result.concat(this.tags))];

        if (all.length <= hashtagService.maxHashtags) {
          this.tags = all;
          return true;
        } else {
          this.maxHashtagsError();
          return false;
        }
      }
      return true;
    },
    /**
     * Set posting
     * @param {boolean} value
     */
    setPosting(value) {
      this.posting = value;
    },
    /**
     * Set text
     * @param {string} text
     */
    setText(text) {
      this.text = text;

      if (!this.attachment.hasAttachment && !this.isRemind) {
        this.embed.richEmbedCheck(text);
      }
    },
    /**
     * Set title
     * @param {string} title
     */
    setTitle(title) {
      this.title = title;
    },
    /**
     * Set selection
     */
    setSelection(selection) {
      this.selection = selection;
    },
    /**
     * Set mode photo
     */
    setModePhoto(clear = true) {
      if (clear) this.clear();
      this.mode = 'photo';
      settingsStore.setComposerMode(this.mode);
    },
    /**
     * Set mode video
     */
    setModeVideo() {
      this.mode = 'video';
      settingsStore.setComposerMode(this.mode);
    },
    /**
     * Set mode text
     */
    setModeText() {
      this.mode = 'text';
      settingsStore.setComposerMode(this.mode);
    },
    /**
     * Clear the store to the initial values
     */
    clear(deleteMedia = true) {
      if (this.mediaToConfirm) {
        this.mediaToConfirm = null;
      }
      if (this.attachment.hasAttachment) {
        if (this.attachment.uploading) {
          this.attachment.cancelCurrentUpload();
        } else {
          if (deleteMedia) {
            this.attachment.delete();
          }
        }
        this.attachment.clear();
      }
      if (this.embed.hasRichEmbed) {
        this.embed.clearRichEmbed();
      }
      this.text = '';
      this.title = '';
      this.extra = null;
      this.mediaToConfirm = null;
      this.posting = false;
      this.entity = null;
      this.mode = 'photo';
      this.isRemind = false;
      this.isEdit = false;
      this.nsfw = [];
      this.time_created = null;
      this.wire_threshold = DEFAULT_MONETIZE;
      this.tags = [];
      this.group = null;
      this.postToPermaweb = false;
    },
    /**
     * On media
     * @param {object} media
     * @param {string} mode
     */
    onMedia(media, mode = 'confirm') {
      setTimeout(() => {
        this.mediaToConfirm = media;
        this.mediaToConfirm.key = 1;
        this.mode = mode;
      }, 100);
    },
    /**
     * Reject acptured image
     */
    rejectImage() {
      this.mediaToConfirm = null;
      this.mode = settingsStore.composerMode;
    },
    /**
     * Select media from gallery
     */
    async selectFromGallery(mode) {
      const response = await attachmentService.gallery(
        mode || this.mode,
        false,
      );

      if (response) {
        this.onMediaFromGallery(response);
      }
    },
    /**
     * On media selected from gallery
     * @param {object} media
     */
    async onMediaFromGallery(media) {
      if (this.portraitMode && media.height < media.width) {
        showError(i18n.t('capture.mediaPortraitError'));
        return;
      }
      this.mediaToConfirm = media;
      this.acceptMedia();
    },
    /**
     * Accept media
     */
    acceptMedia() {
      this.attachment.attachMedia(this.mediaToConfirm, this.extra);
      this.mode = 'text';
    },
    /**
     * is the composer input valid or not. Is it ready to be submitted?
     */
    get isValid() {
      const isEmpty =
        !this.attachment.hasAttachment &&
        !this.text &&
        (!this.embed.meta || !this.embed.meta.url) &&
        !this.isRemind;

      return !isEmpty;
    },
    /**
     * Submit post
     */
    async submit() {
      if (this.posting) {
        return;
      }

      // parse tags from text
      if (!this.parseTags()) {
        return false;
      }

      try {
        // Plus Monetize?
        if (
          this.wire_threshold &&
          'support_tier' in this.wire_threshold &&
          this.wire_threshold.support_tier.urn ===
            mindsConfigService.settings.plus.support_tier_urn
        ) {
          // Must have tags
          if (this.tags.length === 0) {
            showError(i18n.t('capture.noHashtags'));
            return false;
          }

          // Mustn't have external links
          if (
            this.embed.hasRichEmbed &&
            !this.embed.meta.url.toLowerCase().includes('minds.com')
          ) {
            showError(i18n.t('capture.noExternalLinks'));
            return false;
          }
        }

        // is uploading?
        if (this.attachment.hasAttachment && this.attachment.uploading) {
          showError(i18n.t('capture.pleaseTryAgain'));
          return false;
        }

        // Something to post?
        if (!this.isValid) {
          showError(i18n.t('capture.nothingToPost'));
          return false;
        }

        let newPost = {
          message: this.text,
          accessId: this.accessId,
          time_created: Math.floor(this.time_created / 1000) || null,
        };

        if (this.paywalled) {
          newPost.paywall = true;
          newPost.wire_threshold = featuresService.has('paywall-2020')
            ? this.wire_threshold
            : this.wire_threshold.min;
        }

        // add remind
        if (this.isRemind) {
          newPost.remind_guid = this.entity.guid;
        }

        if (this.postToPermaweb) {
          if (this.paywalled) {
            showError(i18n.t('permaweb.cannotMonetize'));
            return false;
          }
          newPost.post_to_permaweb = true;
        }

        if (this.title) {
          newPost.title = this.title;
        }

        newPost.nsfw = this.nsfw || [];

        if (this.attachment.guid) {
          newPost.entity_guid = this.attachment.guid;
          newPost.license = this.attachment.license;
        }

        if (this.embed.meta) {
          newPost = Object.assign(newPost, this.embed.meta);
        }

        if (props.route?.params && props.route.params.group) {
          newPost.container_guid = props.route.params.group.guid;
          this.group = props.route.params.group;
          // remove the group to avoid reuse it on future posts
          props.navigation.setParams({ group: undefined });
        }

        // keep the container if it is an edited activity
        if (this.isEdit && typeof this.entity.container_guid !== 'undefined') {
          newPost.container_guid = this.entity.container_guid;
        }

        if (this.tags.length) {
          newPost.tags = this.tags;
        }

        this.setPosting(true);

        const guidParam = this.isEdit ? `/${this.entity.guid}` : '';

        const response = await api.post(`api/v2/newsfeed${guidParam}`, newPost);
        if (response && response.activity) {
          if (this.isEdit) {
            this.entity.update(response.activity);
            this.entity.setEdited('1');
            return this.entity;
          }
          return ActivityModel.create(response.activity);
        }
      } catch (e) {
        const message = getNetworkError(e);
        if (message) {
          showError(message);
        } else {
          showError(i18n.t('errorMessage') + '\n' + i18n.t('pleaseTryAgain'));
        }
        logService.exception(e);
      } finally {
        this.setPosting(false);
      }
    },
    setRemindEntity(entity) {
      this.entity = entity;
      this.isRemind = true;
    },
    async saveMembsershipMonetize(support_tier) {
      this.wire_threshold = { support_tier };
    },
    async saveCustomMonetize(usd, has_usd, has_tokens) {
      const support_tier = await supportTiersService.createPrivate(
        usd,
        has_usd,
        has_tokens,
      );
      this.wire_threshold = { support_tier };
    },
    async savePlusMonetize(expires) {
      this.wire_threshold = {
        support_tier: {
          urn: mindsConfigService.getSettings().plus.support_tier_urn,
          expires,
        },
      };
    },
    clearWireThreshold() {
      this.wire_threshold = DEFAULT_MONETIZE;
    },
    get haveSupportTier() {
      return (
        this.wire_threshold &&
        'support_tier' in this.wire_threshold &&
        this.wire_threshold.support_tier.urn
      );
    },
    get paywalled() {
      return (
        (featuresService.has('paywall-2020') && this.haveSupportTier) ||
        (this.wire_threshold && this.wire_threshold.min > 0)
      );
    },
    togglePostToPermaweb() {
      this.postToPermaweb = !this.postToPermaweb;
    },
    isGroup() {
      return !!props.route?.params?.group;
    },
    maxHashtagsError() {
      showError(
        i18n.t('capture.maxHashtags', {
          maxHashtags: hashtagService.maxHashtags,
        }),
      );
    },
  };
}
