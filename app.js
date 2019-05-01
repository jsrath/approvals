function getData() {
  fetch('./example.json')
    .then(data => data.json())
    .then(data => getReviewers(data));
}

function createRepoArrays(value) {
  const repo = value.fromRef.repository.name;
  allRepos[repo]
    ? (allRepos[repo] = [...allRepos[repo], ...value.reviewers.map(reviewer => reviewer.user.displayName)])
    : (allRepos[repo] = value.reviewers.map(reviewer => reviewer.user.displayName));
}

function getReviewerOccurances() {
  Object.keys(allRepos).map(repo => {
    allRepos[repo].forEach(reviewer => {
      let rev = {};
      rev.name = reviewer;
      rev[repo] = allRepos[repo].filter(currentReviewer => currentReviewer === reviewer).length;

      if (reviewersByRepo.some(element => element.name === reviewer)) {
        const index = reviewersByRepo.map(element => element.name).indexOf(reviewer);
        reviewersByRepo[index] = { ...reviewersByRepo[index], ...rev };
      } else {
        reviewersByRepo = [...reviewersByRepo, rev];
      }
    });
    reviewersByRepo.map(element => element[repo] || (element[repo] = 0));
  });
}

function getReviewers(pullRequests) {
  pullRequests.values.map(value => {
    value.reviewers = value.reviewers.filter(reviewer => reviewer.approved);
    createRepoArrays(value);
  });
  getReviewerOccurances();
  reviewersByRepo.sort((a, b) => b.repoOne + b.repoTwo + b.repoThree - (a.repoOne + a.repoTwo + a.repoThree));
  drawChart(reviewersByRepo);
}

function drawChart(data) {
  d3.select('.container')
    .append('svg')
    .attr('width', '90%')
    .attr('height', 600);

  const xScale = d3
    .scaleLinear()
    .domain([0, 16])
    .range([20, '1300']);

  const yScale = d3
    .scaleLinear()
    .domain([0, 25])
    .range([580, 20]);

  const heightScale = d3
    .scaleLinear()
    .domain([0, 25])
    .range([20, 580]);

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip');

  const repos = ['repoOne', 'repoTwo', 'repoThree'];

  const colorScale = d3
    .scaleOrdinal()
    .domain(repos)
    .range(['#2962ff', '#00b8d4', '#F44336']);

  yAxis = d3.axisLeft().scale(yScale);

  d3.select('svg')
    .append('g')
    .attr('class', 'yAxis')
    .call(yAxis)
    .attr('transform', `translate(${20}, 0)`);

  xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickValues([]);

  d3.select('svg')
    .append('g')
    .attr('class', 'xAxis')
    .call(xAxis)
    .attr('transform', `translate(0, ${580})`);

  const stackLayout = d3.stack().keys(repos);

  d3.select('svg')
    .selectAll('g.bar')
    .data(stackLayout(data))
    .enter()
    .append('g')
    .attr('class', 'bar')
    .each(function(d) {
      d3.select(this)
        .selectAll('rect')
        .data(d)
        .enter()
        .append('rect')
        .attr('width', 40)
        .attr('height', p => heightScale(p[1]) - heightScale(p[0]))
        .attr('x', (p, i) => xScale(i) * 1.1)
        .attr('y', p => yScale(p[1]))
        .style('fill', colorScale(d.key))
        .on('mouseover', d =>
          tooltip.style('display', 'block').html(
            `<h2>${d.data.name}</h2>
              <hr>
              <p class="repo-one">RepoOne: ${d.data.repoOne}</p>
              <p class="repo-two">RepoTwo: ${d.data.repoTwo}</p>
              <p class="repo-three">RepoThree: ${d.data.repoThree}</p>`,
          ),
        )
        .on('mousemove', () =>
          tooltip.style('top', `${d3.event.pageY + 20}px`).style('left', `${d3.event.pageX + 20}px`),
        )
        .on('mouseout', () => tooltip.style('display', 'none'));
    });
}

getData();
allRepos = {};
reviewersByRepo = [];
