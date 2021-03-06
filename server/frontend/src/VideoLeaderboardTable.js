import React, { useRef, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import sortBy from 'lodash/sortBy'
import moment from 'moment'
import { makeStyles, createStyles } from '@material-ui/styles'
import IconButton from '@material-ui/core/IconButton'
import Fab from '@material-ui/core/Fab'
import Tooltip from '@material-ui/core/Tooltip'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FilledInput from '@material-ui/core/FilledInput'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import FormHelperText from '@material-ui/core/FormHelperText'
import ThumbUpIcon from '@material-ui/icons/ThumbUp'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import SendIcon from '@material-ui/icons/Send'
import SortIcon from '@material-ui/icons/Sort'
import SortByAlphaIcon from '@material-ui/icons/SortByAlpha'
import Theme from './Theme'
import SortByDropdown from './SortByDropdown'
import { H3, H4, H5 } from './Typography'
import { upvoteCid, withdrawCid, getYoutubeVideoData } from './redux/chartActions'
import { timeout, hexToBuffer, parseCid } from './utils'

import './fonts/fonts.css'
import 'typeface-roboto'


function VideoLeaderboardTable(props) {
    const { currentAccount, getYoutubeVideoData, youtubeVideos, upvoteCid, withdrawCid } = props
    const [ order, setOrder ] = useState('desc')
    const [ orderBy, setOrderBy ] = useState('score')
    const [ videoMetadata, setVideoMetadata ] = useState({})

    const classes = useStyles()

    let leaderboardData = sortBy(props.leaderboardData, orderBy)
    if (order === 'desc') {
        leaderboardData.reverse()
    }

    for (let item of leaderboardData) {
        getYoutubeVideoData(item.serviceSpecificID)
    }

    return (
        <div className={classes.root}>
            <SortByDropdown
                orderBy={orderBy}
                direction={order}
                onChangeOrderBy={setOrderBy}
                onChangeDirection={setOrder}
            />

            {leaderboardData.map(item => {
                const canUpvote = item.upvoteIndex === '-'
                const canWithdraw = parseFloat(item.withdrawableBalance) > 0
                return (
                <div key={item.cid} className={classes.row}>

                    <div className={classes.rankAndScore}>
                        <div className={classes.rank}><span style={{ fontSize: '0.9rem', verticalAlign: 'super' }}>#</span>{item.rank+1}</div>
                        {/*<div className={classes.score}>{item.score.toFixed(2)} points</div>*/}
                    </div>

                    <div className={classes.youtubeEmbed}>
                       <iframe frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" width="200" height="120" type="text/html" src={`https://www.youtube.com/embed/${item.serviceSpecificID}?autoplay=0&fs=1&iv_load_policy=3&showinfo=1&rel=0&cc_load_policy=0&start=0&end=0&origin=https://youtubeembedcode.com`}></iframe>
                    </div>

                    <div className={classes.songDetails}>
                        <div className={classes.songTitle}>{(youtubeVideos[ item.serviceSpecificID ] || {}).title}</div>
                        <div className={classes.proposalTimestamp}>Submitted {moment(item.proposalTimestamp*1000).fromNow()}</div>
                    </div>

                    <div className={classes.actionsWrapper}>
                        <div>
                            <Tooltip title="Upvote">
                                <IconButton onClick={canUpvote ? () => upvoteCid(item.cid, currentAccount) : null} size="small">
                                    <ThumbUpIcon className={canUpvote ? '' : classes.iconButtonDisabled} />
                                </IconButton>
                            </Tooltip>
                            <div>{item.allTimeUpvotes}</div>
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <Tooltip title="Withdraw">
                                <IconButton onClick={canWithdraw ? () => withdrawCid(item.cid, currentAccount) : null} size="small">
                                <ExitToAppIcon
                                    className={canWithdraw ? '' : classes.iconButtonDisabled}
                                     />
                                </IconButton>
                            </Tooltip>
                            <div>{item.withdrawableBalance.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                )
            })}

            {leaderboardData.length === 0 &&
                <div>The leaderboard is currently empty.</div>
            }
        </div>

    )
}

const useStyles = makeStyles(theme => createStyles({
    root: {
        margin: '30px 0 20px',
    },
    row: {
        display: 'flex',
        padding: 10,

        '&:hover': {
            backgroundColor: '#f5f5f5',

            '& $actionsWrapper': {
                opacity: 1,
                transition: 'opacity 50ms',
            },
        },
    },
    rankAndScore: {
        display: 'flex',
        flexGrow: 0,
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        height: 'fit-content',
        alignSelf: 'center',
        width: 68,
        padding: '0 20px 0 0',
    },
    rank: {
        fontSize: '2rem',
        color: theme.palette.primary.main,
        // borderBottom: '1px solid #BBBBBB',
        width: '100%',
        textAlign: 'center',
    },
    score: {
        color: '#bbbbbb',
        fontSize: '0.7rem',
        textAlign: 'center',
    },
    tableCell: {
        padding: '4px 20px 4px 16px',
    },
    tableCellActions: {
        opacity: 0,
        transition: 'opacity 50ms',
    },
    iconButtonDisabled: {},
    actionsWrapper: {
        height: 'fit-content',
        alignSelf: 'center',
        display: 'flex',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#bbbbbb',

        '& svg': {
            cursor: 'pointer',
            fill: theme.palette.primary.main,
        },
        '& $iconButtonDisabled': {
            cursor: 'unset',
            fill: '#bbbbbb',
        },
    },

    youtubeEmbed: {
        height: 120,
        alignSelf: 'center',
    },

    songDetails: {
        flexGrow: 1,
        padding: '0 10px 10px 10px',
    },
    songTitle: {
        fontSize: '1.4rem',
        fontWeight: 500,
    },
    proposalTimestamp: {
        color: 'grey',
        fontSize: '0.9rem',
    },
}))

function mapLeaderboardItem(item, upvoteIndices, withdrawableBalances) {
    const [ type, serviceSpecificID ] = parseCid(item.cid)
    return {
        type,
        serviceSpecificID,
        cid: item.cid,
        score: parseFloat(item.score) * 1000,
        allTimeUpvotes: item.allTimeUpvotes,
        numUpvoters: item.numUpvoters,
        upvoteIndex: upvoteIndices[item.cid].eq(0) ? '-' : upvoteIndices[item.cid].toString(),
        submittedInBlock: item.submittedInBlock,
        withdrawableBalance: withdrawableBalances[item.cid],
        proposalTimestamp: item.proposalTimestamp,
    }
}

const mapStateToProps = (state) => {
    let leaderboardData = state.chart.leaderboardData
        .map(item => mapLeaderboardItem(item, state.chart.upvoteIndices, state.chart.withdrawableBalances))
        .filter(item => item.type === 'yt')
        .map((item, i) => ({ ...item, rank: i }))

    return {
        leaderboardData,
        currentAccount: state.chart.currentAccount,
        withdrawableBalances: state.chart.withdrawableBalances,
        upvoteIndices: state.chart.upvoteIndices,
        youtubeVideos: state.chart.youtubeVideos,
    }
}

const mapDispatchToProps = {
    upvoteCid,
    withdrawCid,
    getYoutubeVideoData,
}

export default connect(mapStateToProps, mapDispatchToProps)(VideoLeaderboardTable)
