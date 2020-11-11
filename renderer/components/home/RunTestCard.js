import React from 'react'
import PropTypes from 'prop-types'
import { Flex, Box, Text } from 'ooni-components'
import styled from 'styled-components'

const Card = styled(Box)`
  border-radius: 8px;
  box-shadow: 0px 0px 6px 0px ${props => props.theme.colors.gray7};
  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 6px 1px ${props => props.theme.colors.gray7};
  }

  &:active {
    box-shadow: 0px 0px 6px 2px ${props => props.theme.colors.gray7};
  }
`

const CardDescription = styled(Box)`
  & p {
    margin: 0; /* Override {margin-{top,bottom}: '32px'} on FormattedMarkdownMessage */
  }
`

const RunTestCard = ({ name, color, icon, description, onRun }) => {
  return (
    <Card mb={4} p={2} onClick={onRun}>
      <Flex alignItems='center'>
        <Box>
          {React.cloneElement(
            icon,
            {size: 80, color: color}
          )}
        </Box>
        <Box ml={3} py={2}>
          <Flex flexDirection='column'>
            <Box>
              <Text fontSize={2} fontWeight='bolder'>
                {name}
              </Text>
            </Box>
            <CardDescription fontSize={1} mt={2}>{description}</CardDescription>
          </Flex>
        </Box>

      </Flex>
    </Card>
  )
}

RunTestCard.propTypes = {
  id: PropTypes.string,
  onRun: PropTypes.func,
  name: PropTypes.elem,
  color: PropTypes.string,
  icon: PropTypes.elem,
  description: PropTypes.elem
}

export default RunTestCard
