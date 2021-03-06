import * as React from "react";
import gql from "graphql-tag";
import {
  Legend,
  LegendColumn,
  RowColumn,
  RowContainer
} from "../ListComponents";
import { RunTag } from "./RunTag";
import {
  RunTableRunFragment,
  RunTableRunFragment_tags
} from "./types/RunTableRunFragment";
import { TokenizingFieldValue } from "../TokenizingField";
import { RUNS_ROOT_QUERY, RunsQueryVariablesContext } from "./RunsRoot";
import PythonErrorInfo from "../PythonErrorInfo";
import { NonIdealState, Icon } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import {
  titleForRun,
  RunStatusWithStats,
  RunActionsMenu,
  RunTime,
  RunElapsed,
  RunComponentFragments
} from "./RunUtils";

interface RunTableProps {
  runs: RunTableRunFragment[];
  onSetFilter: (search: TokenizingFieldValue[]) => void;
}

export class RunTable extends React.Component<RunTableProps> {
  static fragments = {
    RunTableRunFragment: gql`
      fragment RunTableRunFragment on PipelineRun {
        runId
        status
        stepKeysToExecute
        canTerminate
        mode
        rootRunId
        parentRunId
        pipelineSnapshotId
        pipelineName
        solidSelection
        tags {
          key
          value
        }
        ...RunTimeFragment
      }

      ${PythonErrorInfo.fragments.PythonErrorFragment}
      ${RunComponentFragments.RUN_TIME_FRAGMENT}
    `
  };

  render() {
    if (this.props.runs.length === 0) {
      return (
        <div style={{ marginTop: 100 }}>
          <NonIdealState
            icon="history"
            title="Pipeline Runs"
            description="No runs to display. Use the Playground to start a pipeline."
          />
        </div>
      );
    }
    return (
      <div>
        <Legend>
          <LegendColumn style={{ maxWidth: 30 }} />
          <LegendColumn style={{ maxWidth: 90 }}>Run</LegendColumn>
          <LegendColumn style={{ flex: 5 }}></LegendColumn>
          <LegendColumn style={{ flex: 1 }}>Execution Params</LegendColumn>
          <LegendColumn style={{ maxWidth: 140 }}>Timing</LegendColumn>
          <LegendColumn style={{ maxWidth: 50 }}></LegendColumn>
        </Legend>
        {this.props.runs.map(run => (
          <RunRow
            run={run}
            key={run.runId}
            onSetFilter={this.props.onSetFilter}
          />
        ))}
      </div>
    );
  }
}

const RunRow: React.FunctionComponent<{
  run: RunTableRunFragment;
  onSetFilter: (search: TokenizingFieldValue[]) => void;
}> = ({ run, onSetFilter }) => {
  const variables = React.useContext(RunsQueryVariablesContext);

  const onTagClick = (tag: RunTableRunFragment_tags) => {
    onSetFilter([{ token: "tag", value: `${tag.key}=${tag.value}` }]);
  };

  const pipelineLink = `/pipeline/${run.pipelineName}@${run.pipelineSnapshotId}/`;

  const refetchQueries = [{ query: RUNS_ROOT_QUERY, variables }];

  return (
    <RowContainer key={run.runId} style={{ paddingRight: 3 }}>
      <RowColumn
        style={{
          maxWidth: 30,
          paddingLeft: 0,
          display: "flex",
          alignItems: "flex-start"
        }}
      >
        <RunStatusWithStats status={run.status} runId={run.runId} size={14} />
      </RowColumn>
      <RowColumn style={{ maxWidth: 90, fontFamily: "monospace" }}>
        <Link to={`/runs/${run.pipelineName}/${run.runId}`}>
          {titleForRun(run)}
        </Link>
      </RowColumn>
      <RowColumn style={{ flex: 5 }}>
        <div style={{ display: "flex" }}>
          <Link to={pipelineLink}>
            <Icon icon="diagram-tree" /> {run.pipelineName}
          </Link>
        </div>
        <RunTags tags={run.tags} onClick={onTagClick} />
      </RowColumn>
      <RowColumn>
        <div>
          <div>{`Mode: ${run.mode}`}</div>
        </div>
      </RowColumn>
      <RowColumn style={{ maxWidth: 140, borderRight: 0 }}>
        <RunTime run={run} />
        <RunElapsed run={run} />
      </RowColumn>
      <RowColumn style={{ maxWidth: 50 }}>
        <RunActionsMenu run={run} refetchQueries={refetchQueries} />
      </RowColumn>
    </RowContainer>
  );
};

const RunTags: React.FunctionComponent<{
  tags: RunTableRunFragment_tags[];
  onClick?: (tag: { key: string; value: string }) => void;
}> = ({ tags, onClick }) => {
  if (!tags.length) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        paddingTop: 7
      }}
    >
      {tags.map((tag, idx) => (
        <RunTag tag={tag} key={idx} onClick={onClick} />
      ))}
    </div>
  );
};
