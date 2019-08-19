/**
 * The Graph component is a dumb component - it receives data from Plan Component and uses it to draw the "options space".
 * The options space is drawn using the Scatter graph component provided by react-chartjs-2
 */

import React, { Component } from 'react';
import { Scatter } from 'react-chartjs-2';
import './Graph.css';
import img  from '../../resources/images/options-space-bg3.png'

class Graph extends Component {

    render() {
        // should only attempt to draw the graph if the necessary data has been provided
        if(this.props.graphData) {
            // create dataset object required for drawing the scatter graph
            const dataset = {
                labels: ['Scatter'],
                datasets: [
                    {
                        label: 'Team A\'s user stories',
                        fill: false,
                        backgroundColor: 'rgb(235, 76, 41, 0.4)',
                        pointBorderColor: 'rgba(235, 76, 41, 1)',
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 1,
                        pointHoverRadius: 10,
                        pointHoverBackgroundColor: 'rgba(235, 76, 41, 1)',
                        pointHoverBorderColor: 'rgba(220,220,220, 1)',
                        pointHoverBorderWidth: 2,
                        data: this.props.graphData
                    }
                ]
            }

            // create options object that customise the scatter graph as needed
            const graphOptions = {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'top',
                        ticks: {
                            beginAtZero:true,
                            stepSize: 0.2,
                            max: 2,
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Value-to-Cost'
                          }
                    }],
                    yAxes: [{
                        ticks: {
                            reverse: true,
                            beginAtZero:true,
                            stepSize: 0.2,
                            max: 2
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Volatility'
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        title: (items, data) => data.datasets[items[0].datasetIndex].data[items[0].index].title,
                      }
                }
            };

            return (
                <div className="graph-container">
                    <img src={img} alt={img} className="graph-background"></img>
                    <Scatter data={dataset} options={graphOptions} width={800} height={600}/>
                </div>
            );
        } else {
            return (
                <div/>
            );
        }
    }
}

export default Graph;