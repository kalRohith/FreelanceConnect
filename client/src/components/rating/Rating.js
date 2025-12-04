import './Rating.css';

const Stars = ({ value }) => {
    const starsElement = []
    for (let i = 0; i < Math.floor(value); i++) {
        starsElement.push(<i
            key={i}
            className="fa fa-star"
            aria-hidden="true"></i>)
    }
    for (let i = 0; i < 5 - Math.floor(value); i++) {
        starsElement.push(
            <i
                key={i + Math.floor(value)}
                className="fa fa-star disabled"
                aria-hidden="true">
            </i>
        )
    }
    return starsElement;
}

function Rating(props) {
    return (
        <div className="rating">
            <div className="rating__stars">
                <Stars value={props.value} />
            </div>
        </div>
    )
}

export default Rating;