const qs = window.Qs;
const request = window.superagent;
const ReactDOM = window.ReactDOM;
const React = window.React;

let spotifyUser;
const appMountNode = window.document.getElementById('app');
const spotifyToken = qs.parse(location.search, {ignoreQueryPrefix: true}).token;
const render = function() {
	ReactDOM.render(<App user={spotifyUser} />, appMountNode);
};

// Error out if we don't have a token
if (!spotifyToken) { alert('An error has occurred. Try logging in again.'); }

// Fetch user info to show
request.get('https://api.spotify.com/v1/me')
	.set({Authorization: 'Bearer ' + spotifyToken})
	.end(function(error, response) {
		if (error) { alert('An error has occurred. Try refreshing the page.'); }
		
		spotifyUser = response.body;
		render();
	});
	
// App Component
const App = React.createClass({ // eslint-disable-line
	getInitialState() {
		return {
			nextSpotifyTracksUrl: 'https://api.spotify.com/v1/me/tracks?offset=0&limit=50',
			isLoadingSpotifyLibrary: false,
			tracks: [],
		};
	},
	
	loadSpotifyLibrary() {
		if (!this.state.nextSpotifyTracksUrl) {
			this.setState({isLoadingSpotifyLibrary: false});
			return;
		}
		
		this.setState({isLoadingSpotifyLibrary: true});
		
		this.spotifyLibraryRequest = request.get(this.state.nextSpotifyTracksUrl)
			.set({Authorization: 'Bearer ' + spotifyToken})
			.end((error, response) => {
				if (error) {
					this.setState({isLoadingSpotifyLibrary: false});
					alert(error);
					return;
				}
				
				this.setState({
					nextSpotifyTracksUrl: response.body.next,
					tracks: [
						...this.state.tracks,
						...response.body.items
					]
				}, this.loadSpotifyLibrary);
			});
	},
	
	cancelLoadingLibrary() {
		this.spotifyLibraryRequest && this.spotifyLibraryRequest.abort();
		this.setState({isLoadingSpotifyLibrary: false});
	},
	
	downloadLibrary() {
		alert('downloading!');
	},
	
	getDownloadLink() {
		const urlHeader = 'data:text/csv;charset=utf-8,';
		
		const csvHeader = [
			'Track',
			'Artist',
			'Album',
			'Date Added'
		];
		
		const tracks = this.state.tracks.map(item => {
			return [
				'"' + item.track.name + '"',
				'"' + item.track.artists.map(a => a.name).join(', ') + '"',
				'"' + item.track.album.name + '"',
				new Date(item.added_at),
			];
		});
		
		const csvRows = [
			csvHeader,
			...tracks,
		];
		
		const csvString = csvRows.reduce(function(csvString, row, index) {
			const rowString = row.join(',');
			
			csvString = csvString + rowString;
			if (index < csvRows.length) { csvString = csvString + '\n'; }
			
			return csvString;
		}, '');
		
		return encodeURI(urlHeader + csvString);
	},
	
	render() {
		const {user} = this.props;
		const {
			isLoadingSpotifyLibrary,
			tracks
		} = this.state;
		
		return (
			<div>
				<h1>
					<img className="logo" src="/assets/logo.png" />
					{' '}
					{user.id}
				</h1>
				<p>
					{this.renderUserInfo()}
					{' '}
					{isLoadingSpotifyLibrary && this.renderCancel()}
					{(tracks.length > 0 && !isLoadingSpotifyLibrary) && this.renderDownload()}
				</p>
				<hr/>
				{this.renderList()}
			</div>
		);
	},
	
	renderUserInfo() {
		const {
			isLoadingSpotifyLibrary
		} = this.state;
		
		return (
			<button
				onClick={this.loadSpotifyLibrary}
				disabled={isLoadingSpotifyLibrary}>
				{isLoadingSpotifyLibrary ? 'Loading...' : 'Load Spotify Library'}
			</button>
		);
	},
	
	renderList() {
		const {tracks} = this.state;
		
		let listHeader = tracks.length > 0 ? <h2>Tracks ({tracks.length})</h2> : <h2 style={{opacity: 0.25}}>No Tracks Loaded</h2>;
		
		if (this.state.isLoadingSpotifyLibrary) {
			listHeader = <h2 style={{opacity: 0.25}}>Loading Tracks...</h2>;
		}
		
		const trackLinks = tracks.map(item => (
			<li>
				<a target="_blank" href={item.track.external_urls.spotify}>
					{item.track.name}
					<span style={{opacity: 0.5}}> — {item.track.artists[0].name}</span>
				</a>
			</li>
		));
		
		return (
			<div>
				{listHeader}
				<ul>
					{trackLinks}
				</ul>
			</div>
		);
	},
	
	renderCancel() {
		return (
			<button onClick={this.cancelLoadingLibrary}>
				Cancel
			</button>
		);
	},
	
	renderDownload() {
		const today = new Date();
		
		return (
			<a
				className="downloadLink"
				href={this.getDownloadLink()}
				download={`spotify-library-export-${today.toLocaleString()}.csv`}>
				Download Library as CSV
			</a>
		);
	},
});