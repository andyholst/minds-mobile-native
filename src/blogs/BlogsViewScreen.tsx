import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { inject, observer } from 'mobx-react';
import React, { Component } from 'react';
import { Alert, FlatList, SafeAreaView, View } from 'react-native';
import { Icon } from 'react-native-elements';
import FastImage, { Source } from 'react-native-fast-image';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import SmallCircleButton from '~/common/components/SmallCircleButton';
import Actions from '~/newsfeed/activity/Actions';
import CommentBottomSheet from '../comments/v2/CommentBottomSheet';
import CenteredLoading from '../common/components/CenteredLoading';
import MText from '../common/components/MText';
import SmartImage from '../common/components/SmartImage';
import { FLAG_VIEW } from '../common/Permissions';
import i18n from '../common/services/i18n.service';
import logService from '../common/services/log.service';
import { AppStackParamList } from '../navigation/NavigationTypes';
import OwnerBlock from '../newsfeed/activity/OwnerBlock';
import { ComponentsStyle } from '../styles/Components';
import ThemedStyles from '../styles/ThemedStyles';
import Lock from '../wire/v2/lock/Lock';
import BlogActionSheet from './BlogActionSheet';
import BlogsViewStore from './BlogsViewStore';
import BlogViewHTML from './BlogViewHTML';

type BlogScreenRouteProp = RouteProp<AppStackParamList, 'BlogView'>;
type BlogScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'BlogView'
>;

type PropsType = {
  blogsView: BlogsViewStore;
  route: BlogScreenRouteProp;
  navigation: BlogScreenNavigationProp;
};

/**
 * Blog View Screen
 */
@inject('user')
@observer
export default class BlogsViewScreen extends Component<PropsType> {
  commentsRef: any;
  blogsView: BlogsViewStore;

  /**
   * Disable navigation bar
   */
  static navigationOptions = {
    header: null,
  };

  state = {
    error: null,
  };

  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.commentsRef = React.createRef();
    this.blogsView = props.blogsView ?? new BlogsViewStore();
  }

  /**
   * Component did mount
   */
  async componentDidMount() {
    const params = this.props.route.params;
    try {
      if (params.blog) {
        await this.blogsView.setBlog(params.blog);

        if (!params.blog.description) {
          await this.blogsView.loadBlog(params.blog.guid);
        }
      } else {
        this.blogsView.reset();
        let guid;
        if (params.slug) {
          guid = params.slug.substr(params.slug.lastIndexOf('-') + 1);
        } else {
          guid = params.guid;
        }

        await this.blogsView.loadBlog(guid);
      }

      // check permissions
      if (!this.blogsView.blog?.can(FLAG_VIEW, true)) {
        this.props.navigation.goBack();
        return;
      }

      if (this.blogsView.blog) {
        this.blogsView.blog.sendViewed('single');
      }
    } catch (error: any) {
      logService.exception(error);
      Alert.alert(
        'Error',
        error.message || i18n.t('blogs.errorLoading'),
        [{ text: i18n.t('ok'), onPress: () => this.props.navigation.goBack() }],
        { cancelable: false },
      );
    }
  }

  /**
   * On component will unmount
   */
  componentWillUnmount() {
    this.blogsView.reset();
  }

  getToolbar() {
    const blog = this.blogsView.blog;
    if (!blog) {
      return null;
    }
    const theme = ThemedStyles.style;

    return (
      <SafeAreaView style={theme.bgPrimaryBackground}>
        <Actions
          onPressComment={() => {
            this.commentsRef.current.expand();
          }}
          entity={blog}
        />
      </SafeAreaView>
    );
  }

  /**
   * Render blog
   */
  getBody() {
    const blog = this.blogsView.blog;
    if (!blog) {
      return null;
    }
    const theme = ThemedStyles.style;
    const image = blog.getBannerSource();

    return (
      <FlatList
        data={['header', 'ownerBlock', 'body']}
        stickyHeaderIndices={[1]}
        renderItem={({ item }) => {
          switch (item) {
            case 'header':
              return (
                <>
                  <SmartImage
                    source={image as Source}
                    resizeMode={FastImage.resizeMode.cover}
                    style={styles.image}
                  />
                  <MText style={styles.title}>{blog.title}</MText>
                  <SafeAreaView style={styles.header}>
                    <SmallCircleButton
                      name="chevron-left"
                      raised
                      size={20}
                      style={theme.colorIcon}
                      onPress={this.props.navigation.goBack}
                      iconStyle={styles.iconStyle}
                    />
                  </SafeAreaView>
                </>
              );
            case 'ownerBlock':
              return (
                <SafeAreaInsetsContext.Consumer>
                  {insets => (
                    <View
                      style={[
                        styles.ownerBlockContainer,
                        { paddingTop: insets?.top },
                      ]}>
                      <OwnerBlock
                        entity={blog}
                        navigation={this.props.navigation}
                        rightToolbar={
                          <View style={styles.actionSheet}>
                            <BlogActionSheet
                              entity={blog}
                              navigation={this.props.navigation}
                            />
                          </View>
                        }>
                        <MText
                          style={[styles.timestamp, theme.colorSecondaryText]}>
                          {i18n.date(parseInt(blog.time_created, 10) * 1000)}
                        </MText>
                      </OwnerBlock>
                    </View>
                  )}
                </SafeAreaInsetsContext.Consumer>
              );
            case 'body':
              return (
                <View>
                  <View style={styles.description}>
                    {blog.description ? (
                      <BlogViewHTML html={blog.description} />
                    ) : blog.paywall ? (
                      // FIXME: Lock text is white on white and overlaps with license
                      <Lock entity={blog} navigation={this.props.navigation} />
                    ) : (
                      <CenteredLoading />
                    )}
                  </View>
                  {!blog.paywall && (
                    <View style={styles.moreInformation}>
                      {Boolean(blog.getLicenseText()) && (
                        <Icon style={theme.colorIcon} size={18} name="public" />
                      )}
                      <MText
                        style={[
                          theme.fontXS,
                          theme.paddingLeft,
                          theme.colorSecondaryText,
                          theme.paddingRight2x,
                        ]}>
                        {blog.getLicenseText()}
                      </MText>
                    </View>
                  )}
                </View>
              );
            default:
              return null;
          }
        }}
      />
    );
  }

  /**
   * Show an error message
   */
  showError() {
    Alert.alert(
      i18n.t('sorry'),
      i18n.t('errorMessage') + '\n' + i18n.t('activity.tryAgain'),
      [
        {
          text: i18n.t('ok'),
          onPress: () => {},
        },
      ],
      { cancelable: false },
    );
  }

  /**
   * Render
   */
  render() {
    const theme = ThemedStyles.style;

    // TODO: add loading state
    if (!this.blogsView.blog) {
      return <CenteredLoading />;
    } else {
      // force observe on description
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const desc = this.blogsView.blog.description;
    }

    // check async update of permissions
    if (!this.blogsView.blog.can(FLAG_VIEW, true)) {
      this.props.navigation.goBack();
      return null;
    }

    return (
      <View style={styles.container}>
        {!this.state.error ? (
          <>
            {this.getBody()}
            {this.getToolbar()}
            {this.blogsView.comments && (
              <CommentBottomSheet
                ref={this.commentsRef}
                hideContent={false}
                commentsStore={this.blogsView.comments}
              />
            )}
          </>
        ) : (
          <View style={theme.flexColumnCentered}>
            <FastImage
              resizeMode={FastImage.resizeMode.contain}
              style={ComponentsStyle.logo}
              source={require('../assets/logos/logo.png')}
            />
            <MText style={[theme.fontL, theme.colorAlert]}>
              {i18n.t('blogs.error')}
            </MText>
            <MText style={[theme.fontM]}>{i18n.t('activity.tryAgain')}</MText>
          </View>
        )}
      </View>
    );
  }
}

/**
 * Styles
 */
const styles = ThemedStyles.create({
  actionSheet: {
    paddingLeft: 5,
  },
  header: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
  },
  title: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 22,
    // fontWeight: '800',
    fontFamily: 'Roboto-Black', // workaround android ignoring >= 800
  },
  ownerBlockContainer: ['bgSecondaryBackground'],
  description: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  image: {
    height: 200,
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
  },
  moreInformation: {
    padding: 12,
    flexDirection: 'row',
  },
  container: ['flexContainer', 'bgSecondaryBackground'],
  iconStyle: { fontSize: 28 },
});
