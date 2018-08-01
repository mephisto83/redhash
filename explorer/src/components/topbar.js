import React, {Component} from 'react'
import { connect } from 'react-redux'
import * as Util from '../util';

class TopBar extends Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }
    render() {

        var {state, dispatch} = this.props;
        return (
            <section>
            {/* <!-- Left Sidebar --> */}
            <aside id="leftsidebar" className="sidebar">
                {/* <!-- User Info --> */}
                <div className="user-info">
                    <div className="image">
                        <img src="images/user.png" width="48" height="48" alt="User" />
                    </div>
                    <div className="info-container">
                        <div className="name" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">John Doe</div>
                        <div className="email">john.doe@example.com</div>
                        <div className="btn-group user-helper-dropdown">
                            <i className="material-icons" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">keyboard_arrow_down</i>
                            <ul className="dropdown-menu pull-right">
                                <li><a href="javascript:void(0);"><i className="material-icons">person</i>Profile</a></li>
                                <li role="separator" className="divider"></li>
                                <li><a href="javascript:void(0);"><i className="material-icons">group</i>Followers</a></li>
                                <li><a href="javascript:void(0);"><i className="material-icons">shopping_cart</i>Sales</a></li>
                                <li><a href="javascript:void(0);"><i className="material-icons">favorite</i>Likes</a></li>
                                <li role="separator" className="divider"></li>
                                <li><a href="javascript:void(0);"><i className="material-icons">input</i>Sign Out</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                {/* <!-- #User Info --> */}
                {/* <!-- Menu --> */}
                <div className="menu">
                    <ul className="list">
                        <li className="header">MAIN NAVIGATION</li>
                        <li className="active">
                            <a href="index.html">
                                <i className="material-icons">home</i>
                                <span>Home</span>
                            </a>
                        </li>
                        <li>
                            <a href="pages/typography.html">
                                <i className="material-icons">text_fields</i>
                                <span>Typography</span>
                            </a>
                        </li>
                        <li>
                            <a href="pages/helper-classes.html">
                                <i className="material-icons">layers</i>
                                <span>Helper Classes</span>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">widgets</i>
                                <span>Widgets</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="javascript:void(0);" className="menu-toggle">
                                        <span>Cards</span>
                                    </a>
                                    <ul className="ml-menu">
                                        <li>
                                            <a href="pages/widgets/cards/basic.html">Basic</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/cards/colored.html">Colored</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/cards/no-header.html">No Header</a>
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" className="menu-toggle">
                                        <span>Infobox</span>
                                    </a>
                                    <ul className="ml-menu">
                                        <li>
                                            <a href="pages/widgets/infobox/infobox-1.html">Infobox-1</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/infobox/infobox-2.html">Infobox-2</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/infobox/infobox-3.html">Infobox-3</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/infobox/infobox-4.html">Infobox-4</a>
                                        </li>
                                        <li>
                                            <a href="pages/widgets/infobox/infobox-5.html">Infobox-5</a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">swap_calls</i>
                                <span>User Interface (UI)</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/ui/alerts.html">Alerts</a>
                                </li>
                                <li>
                                    <a href="pages/ui/animations.html">Animations</a>
                                </li>
                                <li>
                                    <a href="pages/ui/badges.html">Badges</a>
                                </li>
    
                                <li>
                                    <a href="pages/ui/breadcrumbs.html">Breadcrumbs</a>
                                </li>
                                <li>
                                    <a href="pages/ui/buttons.html">Buttons</a>
                                </li>
                                <li>
                                    <a href="pages/ui/collapse.html">Collapse</a>
                                </li>
                                <li>
                                    <a href="pages/ui/colors.html">Colors</a>
                                </li>
                                <li>
                                    <a href="pages/ui/dialogs.html">Dialogs</a>
                                </li>
                                <li>
                                    <a href="pages/ui/icons.html">Icons</a>
                                </li>
                                <li>
                                    <a href="pages/ui/labels.html">Labels</a>
                                </li>
                                <li>
                                    <a href="pages/ui/list-group.html">List Group</a>
                                </li>
                                <li>
                                    <a href="pages/ui/media-object.html">Media Object</a>
                                </li>
                                <li>
                                    <a href="pages/ui/modals.html">Modals</a>
                                </li>
                                <li>
                                    <a href="pages/ui/notifications.html">Notifications</a>
                                </li>
                                <li>
                                    <a href="pages/ui/pagination.html">Pagination</a>
                                </li>
                                <li>
                                    <a href="pages/ui/preloaders.html">Preloaders</a>
                                </li>
                                <li>
                                    <a href="pages/ui/progressbars.html">Progress Bars</a>
                                </li>
                                <li>
                                    <a href="pages/ui/range-sliders.html">Range Sliders</a>
                                </li>
                                <li>
                                    <a href="pages/ui/sortable-nestable.html">Sortable & Nestable</a>
                                </li>
                                <li>
                                    <a href="pages/ui/tabs.html">Tabs</a>
                                </li>
                                <li>
                                    <a href="pages/ui/thumbnails.html">Thumbnails</a>
                                </li>
                                <li>
                                    <a href="pages/ui/tooltips-popovers.html">Tooltips & Popovers</a>
                                </li>
                                <li>
                                    <a href="pages/ui/waves.html">Waves</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">assignment</i>
                                <span>Forms</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/forms/basic-form-elements.html">Basic Form Elements</a>
                                </li>
                                <li>
                                    <a href="pages/forms/advanced-form-elements.html">Advanced Form Elements</a>
                                </li>
                                <li>
                                    <a href="pages/forms/form-examples.html">Form Examples</a>
                                </li>
                                <li>
                                    <a href="pages/forms/form-validation.html">Form Validation</a>
                                </li>
                                <li>
                                    <a href="pages/forms/form-wizard.html">Form Wizard</a>
                                </li>
                                <li>
                                    <a href="pages/forms/editors.html">Editors</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">view_list</i>
                                <span>Tables</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/tables/normal-tables.html">Normal Tables</a>
                                </li>
                                <li>
                                    <a href="pages/tables/jquery-datatable.html">Jquery Datatables</a>
                                </li>
                                <li>
                                    <a href="pages/tables/editable-table.html">Editable Tables</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">perm_media</i>
                                <span>Medias</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/medias/image-gallery.html">Image Gallery</a>
                                </li>
                                <li>
                                    <a href="pages/medias/carousel.html">Carousel</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">pie_chart</i>
                                <span>Charts</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/charts/morris.html">Morris</a>
                                </li>
                                <li>
                                    <a href="pages/charts/flot.html">Flot</a>
                                </li>
                                <li>
                                    <a href="pages/charts/chartjs.html">ChartJS</a>
                                </li>
                                <li>
                                    <a href="pages/charts/sparkline.html">Sparkline</a>
                                </li>
                                <li>
                                    <a href="pages/charts/jquery-knob.html">Jquery Knob</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">content_copy</i>
                                <span>Example Pages</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/examples/sign-in.html">Sign In</a>
                                </li>
                                <li>
                                    <a href="pages/examples/sign-up.html">Sign Up</a>
                                </li>
                                <li>
                                    <a href="pages/examples/forgot-password.html">Forgot Password</a>
                                </li>
                                <li>
                                    <a href="pages/examples/blank.html">Blank Page</a>
                                </li>
                                <li>
                                    <a href="pages/examples/404.html">404 - Not Found</a>
                                </li>
                                <li>
                                    <a href="pages/examples/500.html">500 - Server Error</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">map</i>
                                <span>Maps</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="pages/maps/google.html">Google Map</a>
                                </li>
                                <li>
                                    <a href="pages/maps/yandex.html">YandexMap</a>
                                </li>
                                <li>
                                    <a href="pages/maps/jvectormap.html">jVectorMap</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:void(0);" className="menu-toggle">
                                <i className="material-icons">trending_down</i>
                                <span>Multi Level Menu</span>
                            </a>
                            <ul className="ml-menu">
                                <li>
                                    <a href="javascript:void(0);">
                                        <span>Menu Item</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);">
                                        <span>Menu Item - 2</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" className="menu-toggle">
                                        <span>Level - 2</span>
                                    </a>
                                    <ul className="ml-menu">
                                        <li>
                                            <a href="javascript:void(0);">
                                                <span>Menu Item</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="javascript:void(0);" className="menu-toggle">
                                                <span>Level - 3</span>
                                            </a>
                                            <ul className="ml-menu">
                                                <li>
                                                    <a href="javascript:void(0);">
                                                        <span>Level - 4</span>
                                                    </a>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="pages/changelogs.html">
                                <i className="material-icons">update</i>
                                <span>Changelogs</span>
                            </a>
                        </li>
                        <li className="header">LABELS</li>
                        <li>
                            <a href="javascript:void(0);">
                                <i className="material-icons col-red">donut_large</i>
                                <span>Important</span>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:void(0);">
                                <i className="material-icons col-amber">donut_large</i>
                                <span>Warning</span>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:void(0);">
                                <i className="material-icons col-light-blue">donut_large</i>
                                <span>Information</span>
                            </a>
                        </li>
                    </ul>
                </div>
                {/* <!-- #Menu --> */}
                {/* <!-- Footer --> */}
                <div className="legal">
                    <div className="copyright">
                        &copy; 2016 - 2017 <a href="javascript:void(0);">AdminBSB - Material Design</a>.
                    </div>
                    <div className="version">
                        <b>Version: </b> 1.0.5
                    </div>
                </div>
                {/* <!-- #Footer --> */}
            </aside>
            {/* <!-- #END# Left Sidebar --> */}
            {/* <!-- Right Sidebar --> */}
            <aside id="rightsidebar" className="right-sidebar">
                <ul className="nav nav-tabs tab-nav-right" role="tablist">
                    <li role="presentation" className="active"><a href="#skins" data-toggle="tab">SKINS</a></li>
                    <li role="presentation"><a href="#settings" data-toggle="tab">SETTINGS</a></li>
                </ul>
                <div className="tab-content">
                    <div role="tabpanel" className="tab-pane fade in active in active" id="skins">
                        <ul className="demo-choose-skin">
                            <li data-theme="red" className="active">
                                <div className="red"></div>
                                <span>Red</span>
                            </li>
                            <li data-theme="pink">
                                <div className="pink"></div>
                                <span>Pink</span>
                            </li>
                            <li data-theme="purple">
                                <div className="purple"></div>
                                <span>Purple</span>
                            </li>
                            <li data-theme="deep-purple">
                                <div className="deep-purple"></div>
                                <span>Deep Purple</span>
                            </li>
                            <li data-theme="indigo">
                                <div className="indigo"></div>
                                <span>Indigo</span>
                            </li>
                            <li data-theme="blue">
                                <div className="blue"></div>
                                <span>Blue</span>
                            </li>
                            <li data-theme="light-blue">
                                <div className="light-blue"></div>
                                <span>Light Blue</span>
                            </li>
                            <li data-theme="cyan">
                                <div className="cyan"></div>
                                <span>Cyan</span>
                            </li>
                            <li data-theme="teal">
                                <div className="teal"></div>
                                <span>Teal</span>
                            </li>
                            <li data-theme="green">
                                <div className="green"></div>
                                <span>Green</span>
                            </li>
                            <li data-theme="light-green">
                                <div className="light-green"></div>
                                <span>Light Green</span>
                            </li>
                            <li data-theme="lime">
                                <div className="lime"></div>
                                <span>Lime</span>
                            </li>
                            <li data-theme="yellow">
                                <div className="yellow"></div>
                                <span>Yellow</span>
                            </li>
                            <li data-theme="amber">
                                <div className="amber"></div>
                                <span>Amber</span>
                            </li>
                            <li data-theme="orange">
                                <div className="orange"></div>
                                <span>Orange</span>
                            </li>
                            <li data-theme="deep-orange">
                                <div className="deep-orange"></div>
                                <span>Deep Orange</span>
                            </li>
                            <li data-theme="brown">
                                <div className="brown"></div>
                                <span>Brown</span>
                            </li>
                            <li data-theme="grey">
                                <div className="grey"></div>
                                <span>Grey</span>
                            </li>
                            <li data-theme="blue-grey">
                                <div className="blue-grey"></div>
                                <span>Blue Grey</span>
                            </li>
                            <li data-theme="black">
                                <div className="black"></div>
                                <span>Black</span>
                            </li>
                        </ul>
                    </div>
                    <div role="tabpanel" className="tab-pane fade" id="settings">
                        <div className="demo-settings">
                            <p>GENERAL SETTINGS</p>
                            <ul className="setting-list">
                                <li>
                                    <span>Report Panel Usage</span>
                                    <div className="switch">
                                        <label><input type="checkbox" checked /><span className="lever"></span></label>
                                    </div>
                                </li>
                                <li>
                                    <span>Email Redirect</span>
                                    <div className="switch">
                                        <label><input type="checkbox" /><span className="lever"></span></label>
                                    </div>
                                </li>
                            </ul>
                            <p>SYSTEM SETTINGS</p>
                            <ul className="setting-list">
                                <li>
                                    <span>Notifications</span>
                                    <div className="switch">
                                        <label><input type="checkbox" checked /><span className="lever"></span></label>
                                    </div>
                                </li>
                                <li>
                                    <span>Auto Updates</span>
                                    <div className="switch">
                                        <label><input type="checkbox" checked /><span className="lever"></span></label>
                                    </div>
                                </li>
                            </ul>
                            <p>ACCOUNT SETTINGS</p>
                            <ul className="setting-list">
                                <li>
                                    <span>Offline</span>
                                    <div className="switch">
                                        <label><input type="checkbox" /><span className="lever"></span></label>
                                    </div>
                                </li>
                                <li>
                                    <span>Location Permission</span>
                                    <div className="switch">
                                        <label><input type="checkbox" checked /><span className="lever"></span></label>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </aside>
            {/* <!-- #END# Right Sidebar --> */}
        </section>
        )
    }
}
TopBar = connect(Util.mapStateToProps, Util.mapDispatchToProps)(TopBar)

export default TopBar